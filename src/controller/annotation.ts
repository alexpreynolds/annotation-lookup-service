import { Request, Response } from 'express';

import { Redis } from '@/service/redis';

/**
 * GET $feature for annotation $identifier from $set
 *
 * Examples:
 *
 *   curl -X GET "http://localhost:8080/annotation?set=Index_DHS&identifier=18.758658"
 *
 *   curl -X GET "http://localhost:8080/annotation?set=Index_DHS&identifier=18.758658&feature=interval"
 *
 * @param {Request} req
 * @param {Response} res
 */

export const get = async (req: Request, res: Response) => {
  const feature = req.query.feature;
  const identifier = req.query.identifier;
  const set = req.query.set;
  try {
    const redis = new Redis();
    if (identifier && set) {
      redis.log(
        `Looking up feature [${feature}] for identifier [${identifier}] and set [${set}]`,
      );
      const annotationIdentifier = `${set}:${identifier}`;
      await redis
        .get(annotationIdentifier)
        .then((propertiesString) => {
          if (propertiesString && propertiesString.length > 0) {
            const data = JSON.parse(propertiesString);
            switch (feature) {
              case 'interval': {
                res.status(200).send({
                  description: `Genomic interval associated with identifier [${annotationIdentifier}]`,
                  identifier: annotationIdentifier,
                  data: {
                    seqname: data.seqname,
                    start: data.start,
                    end: data.end,
                  },
                });
                break;
              }
              default: {
                res.status(200).send({
                  description: `All data associated with identifier [${annotationIdentifier}]`,
                  identifier: annotationIdentifier,
                  data: data,
                });
                break;
              }
            }
          } else {
            res.status(404).send({
              message: `No data found that associate with identifier [${annotationIdentifier}]`,
            });
          }
        })
        .catch((err) => {
          throw err;
        });
    } else {
      throw new Error('Unknown feature, identifier, or set');
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
