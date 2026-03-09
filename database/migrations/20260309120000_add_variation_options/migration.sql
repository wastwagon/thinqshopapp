-- Premium product variations: global options (e.g. Size, Color) and values (e.g. S, M, L)
CREATE TABLE "variation_options" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variation_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "variation_options_slug_key" ON "variation_options"("slug");

CREATE TABLE "variation_values" (
    "id" SERIAL NOT NULL,
    "variation_option_id" INTEGER NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variation_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "variation_values_variation_option_id_value_key" ON "variation_values"("variation_option_id", "value");

ALTER TABLE "variation_values" ADD CONSTRAINT "variation_values_variation_option_id_fkey" FOREIGN KEY ("variation_option_id") REFERENCES "variation_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
