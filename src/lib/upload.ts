import multer, { diskStorage } from 'fastify-multer';
import os from 'node:os';
import path from 'node:path';

const upload = multer({
  storage: diskStorage({
    destination: os.tmpdir(),
    filename(_, file, done) {
      const ext = path.extname(file.originalname);
      const filename = `${file.fieldname}-${Date.now()}${ext}`;
      done(null, filename);
    },
  }),
});

export default upload;
