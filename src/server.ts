import app from "./index.js";
import { config } from './config.js';

app.listen(config.api.port, () =>
    console.log(`Server is listening on http://localhost:${config.api.port}`)
);