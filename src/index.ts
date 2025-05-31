import Fastify, { FastifyRequest } from "fastify";
import { prismaClient } from "./lib/prismaClient";

const app = Fastify();

type CreateUserBody = {
  name: string;
  email: string;
};

app.post(
  "/users",
  async (request: FastifyRequest<{ Body: CreateUserBody }>, reply) => {
    const { name, email } = request.body;

    const user = await prismaClient.user.create({
      data: {
        name,
        email,
      },
      select: {
        id: true,
      },
    });

    reply.send({ user });
  }
);

app.post(
  "/users/batch",
  async (
    request: FastifyRequest<{ Body: { users: CreateUserBody[] } }>,
    reply
  ) => {
    const { users } = request.body;

    const user = await prismaClient.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    reply.send({ user });
  }
);

app.get("/users", async (request, reply) => {
  const users = await prismaClient.user.findMany({});

  reply.send({ users });
});

app.get(
  "/users/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;

    const users = await prismaClient.user.findFirstOrThrow({
      where: { id },
    });

    reply.send({ users });
  }
);

app.get("/users/stats", async (request, reply) => {
  const {
    _count: { email: totalEmails },
    _max: { age: oldestPerson },
    _min: { age: yougestPerson },
    _avg: { age: averageAge },
  } = await prismaClient.user.aggregate({
    _count: { email: true },
    _max: { age: true },
    _min: { age: true },
    _avg: { age: true },
  });

  reply.send({
    stats: {
      totalEmails,
      oldestPerson,
      yougestPerson,
      averageAge,
    },
  });
});

app.listen({ port: 3001 }).then(() => console.log("Server is running!"));
