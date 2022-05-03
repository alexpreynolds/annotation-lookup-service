import { Request, Response } from 'express';

import CONFIG from '@/config';

import { Redis } from '@/service/redis';

import * as fs from 'fs';
import { concat } from 'lodash-es';

// import { testRedisClient } from '@/server';

interface MulterRequest extends Request {
  file: any;
}

/**
 * POST a set to a project
 *
 * Example:
 *
 *   curl -F "name=Index_DHS" -F "type=BED4" -F "description=test upload" -F "assembly=hg38" -F "sourceUrl=https://www.meuleman.org/DHS_Index_and_Vocabulary_hg38_WM20190703.txt.gz" -F "file=@test/test.bed" -X POST http://localhost:8080/sets
 *
 * Input file should be minimally BED4 or BED4+
 *
 * @param {MulterRequest} req
 * @param {Response} res
 */

export const post = async (req: MulterRequest, res: Response) => {
  try {
    const redis = new Redis();
    const lineReader = require('line-reader');
    if (!req.file.path)
      throw new Error('Missing upload file path in POST body');
    const body = req.body;
    if (!body || !body.type || !body.assembly || !body.description)
      throw new Error(
        'Missing POST body, set type field, assembly field, or description field',
      );

    const setIdentifier = body.name || redis.uuidv4();
    const project = CONFIG.REDIS.PROJECTS_KEY;
    const set = `set:${setIdentifier}`;
    const type = body.type;
    const timestamp = new Date().toISOString();
    const description = body.description;
    const assembly = body.assembly;
    const sourceUrl = body.sourceUrl || '';

    /**
     * If set does not exist:
     *
     * 1) Add set key to project hash.
     * 2) Add the set key with fields: type, timestamp, description, assembly, source URL metadata (where available).
     * 3) Add each record in records to hash, using identifier `${setIdentifier}:${record.identifier}` to uniquely label it, even if multiple sets use the same identifier.
     *
     * If any particular step/promise fails, throw error. Otherwise, return success.
     */

    redis
      .sAdd(project, set)
      .then(() => {
        redis.log(`Added set [${set}] to project [${project}]`);
        redis.hSet(set, CONFIG.REDIS.SET_TYPE_KEY, type);
        redis.hSet(set, CONFIG.REDIS.SET_TIMESTAMP_KEY, timestamp);
        redis.hSet(set, CONFIG.REDIS.SET_DESCRIPTION_KEY, description);
        redis.hSet(set, CONFIG.REDIS.SET_ASSEMBLY_KEY, assembly);
        let recordsAdded = 0;

        lineReader.eachLine(
          req.file.path,
          (line: string, lastLine: boolean) => {
            const fields = line.split('\t');
            if (fields.length < 4)
              throw new Error('Upload file is missing sufficient fields');
            const annotation = `${setIdentifier}:${fields[3]}`;
            switch (body.type) {
              case 'BED4': {
                redis.set(
                  annotation,
                  JSON.stringify({
                    seqname: fields[0],
                    start: parseInt(fields[1]),
                    end: parseInt(fields[2]),
                  }),
                );
                recordsAdded++;
                break;
              }
              case 'BED4+': {
                try {
                  const remainder = fields.slice(4, fields.length - 1).concat();
                  redis.set(
                    annotation,
                    JSON.stringify({
                      seqname: fields[0],
                      start: parseInt(fields[1]),
                      end: parseInt(fields[2]),
                      remainder: remainder,
                    }),
                  );
                  recordsAdded++;
                } catch {
                } finally {
                  break;
                }
              }
              case 'BED6': {
                redis.set(
                  annotation,
                  JSON.stringify({
                    seqname: fields[0],
                    start: parseInt(fields[1]),
                    end: parseInt(fields[2]),
                    score: parseFloat(fields[4]),
                    strand: fields[5],
                  }),
                );
                recordsAdded++;
                break;
              }
              case 'DHS': {
                redis.set(
                  annotation,
                  JSON.stringify({
                    seqname: fields[0],
                    start: parseInt(fields[1]),
                    end: parseInt(fields[2]),
                    meanSignal: parseFloat(fields[4]) || null,
                    numSamples: parseInt(fields[5]) || null,
                    summit: parseInt(fields[6]) || null,
                    coreStart: parseInt(fields[7]) || null,
                    coreEnd: parseInt(fields[8]) || null,
                    component: fields[9] || null,
                  }),
                );
                recordsAdded++;
                break;
              }
              default: {
                redis.set(
                  annotation,
                  JSON.stringify({
                    seqname: fields[0],
                    start: parseInt(fields[1]),
                    end: parseInt(fields[2]),
                  }),
                );
                recordsAdded++;
                break;
              }
            }

            // redis.log(`Records added: ${recordsAdded}`);

            if (lastLine) {
              res.status(200).send({
                project: project,
                timestamp: timestamp,
                description: description,
                assembly: assembly,
                set: set,
                type: type,
                sourceUrl: sourceUrl,
                recordsAdded: recordsAdded,
              });
            }
          },
        );
      })
      .catch((err: Error) => {
        throw err;
      });

    /**
     * Clean up temporary upload file
     */
    await fs.promises.rm(req.file.path, { force: true });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

/**
 * GET list of sets within project, or list of projects
 *
 * @param {Request} req
 * @param {Response} res
 */

export const get = async (req: Request, res: Response) => {
  const set =
    typeof (req.query.set as string) !== 'undefined'
      ? `set:${req.query.set as string}`
      : '';
  try {
    const redis = new Redis();
    if (set.length > 4) {
      redis.log(`Looking up set [${set}]`);
      await redis
        .hGetAll(set)
        .then((data) => {
          if (data) {
            res.status(200).send({
              description: `Properties associated with set [${set}]`,
              data: data,
            });
          } else {
            res.status(404).send({
              message: `No properties found that associate with set [${set}]`,
            });
          }
        })
        .catch((err) => {
          throw err;
        });
    } else {
      redis.log('Looking up sets for projects');
      await redis
        .sMembers(CONFIG.REDIS.PROJECTS_KEY)
        .then((sets) => {
          if (sets.length > 0) {
            res.status(200).send({
              description: `Available sets for projects`,
              sets: sets,
            });
          } else {
            res.status(404).send({
              message: 'No sets found',
            });
          }
        })
        .catch((err) => {
          throw err;
        });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
