import { FastifyEnvOptions } from "@fastify/env";

const schema = {
  type: "object",
  required: ["DB_URL"],
  properties: {
    DB_URL: { type: "string" },
  },
};

export const getOptions = (): FastifyEnvOptions => {
  const options: FastifyEnvOptions = {
    schema: schema,
    dotenv: {
      path: `${__dirname}/../../${process.env.NODE_ENV || 'development'}.env`,
    },
  };
  return options;
};

