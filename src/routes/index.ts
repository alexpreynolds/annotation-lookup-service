import * as homeController from '@/controller/home';
import * as setsController from '@/controller/sets';
import * as annotationController from '@/controller/annotation';

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

import { Router } from 'express';

const router = Router();

router.get('/', homeController.getAppInfo);
router.get('/githubApiTest', homeController.getGithubAPITest);

router.get('/sets', setsController.get);
router.post('/sets', upload.single('file'), setsController.post);

router.get('/annotation', annotationController.get);

export default router;
