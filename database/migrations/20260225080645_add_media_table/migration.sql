-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "alt" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);
