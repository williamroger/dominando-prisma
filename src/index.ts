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

type UpdateUserBody = {
  name?: string;
  email?: string;
  age?: number;
  isActive?: boolean;
};

app.put(
  "/users/:id",
  async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserBody }>,
    reply
  ) => {
    const { id } = request.params;
    const { age, isActive, email, name } = request.body;

    const user = await prismaClient.user.update({
      data: { age, isActive, email, name },
      where: {
        id,
      },
    });

    reply.send({ user });
  }
);

app.put("/users/batch", async (request: FastifyRequest, reply) => {
  const totalUsers = await prismaClient.user.updateMany({
    data: { isActive: false },
    where: {
      email: {
        endsWith: "@email.com",
      },
    },
  });

  reply.send({ totalUsers });
});

app.delete(
  "/users/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;

    const user = await prismaClient.user.delete({
      where: { id },
    });

    reply.send({ user });
  }
);

app.post(
  "/",
  async (request: FastifyRequest<{ Body: { id: string } }>, reply) => {
    const { id } = request.body;
    // exemplo de SQL Injection
    const result = await prismaClient.$queryRawUnsafe(
      `SELECT * FROM users WHERE id = '${id}'`
    );

    reply.send({ result });
  }
);

app.get("/transactions", async (request, reply) => {
  const [user1, user2, totalUsers] = await prismaClient.$transaction([
    prismaClient.user.create({
      data: {
        name: "novo usuário 01",
        email: "novo-usuario_01@email.com",
      },
    }),
    prismaClient.user.create({
      data: {
        name: "novo usuário 02",
        email: "novo-usuario_02@email.com",
      },
    }),
    prismaClient.user.count(),
  ]);

  reply.send({ user1, user2, totalUsers });
});

app.get("/new-transactions", async (request, reply) => {
  await prismaClient.$transaction(async (prisma) => {
    const user1 = await prisma.user.create({
      data: {
        name: "novo usuário 01",
        email: "novo-usuario_01@email.com",
      },
    });

    if (user1) {
      // aplica regras de negócio aqui!
    }

    const user2 = await prisma.user.create({
      data: {
        name: "novo usuário 02",
        email: "novo-usuario_02@email.com",
      },
    });

    if (user2) {
      // aplica regras de negócio aqui!
    }

    const totalUsers = await prisma.user.count();

    reply.send({ user1, user2, totalUsers });
  });
});

app.get("/users/join", async (request, reply) => {
  const users = await prismaClient.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          github: true,
          instagram: true,
        },
      },
    },
  });

  reply.send({ users });
});

app.listen({ port: 3001 }).then(() => console.log("Server is running!"));
