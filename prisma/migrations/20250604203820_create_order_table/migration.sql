-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
