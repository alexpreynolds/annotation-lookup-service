import * as homeService from '@/service/home';

import { Request, Response } from 'express';

const axios = require('axios');

/**
 * Gets the API information.
 *
 * @param {Request} req
 * @param {Response} res
 */
export const getAppInfo = (req: Request, res: Response) => {
  const result = homeService.getAppInfo();
  res.json(result);
};

export const getGithubAPITest = async (req: Request, res: Response) => {
  const searchTerm = req.query.search;
  try {
    const axiosInstance = axios.create({
      baseURL: 'https://api.github.com/',
      headers: {
        Authorization: 'Bearer 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',
      },
    });
    const result = await axios.get('/');
    res.status(200).send({
      result: result.data,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
