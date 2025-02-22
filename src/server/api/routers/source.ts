import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const positionSchema = z.tuple([z.number(), z.number()]);

const pointSchema = z.object({
  type: z.literal("Point"),
  coordinates: positionSchema,
});

const multiPointSchema = z.object({
  type: z.literal("MultiPoint"),
  coordinates: z.array(positionSchema),
});

const lineSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(positionSchema),
});

const multiLineStringSchema = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(positionSchema)),
});

const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(positionSchema)),
});

const multiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(positionSchema))),
});

const geometrySchema = z.discriminatedUnion("type", [
  pointSchema,
  multiPointSchema,
  lineSchema,
  multiLineStringSchema,
  polygonSchema,
  multiPolygonSchema,
]);

const featureSchema = z.object({
  type: z.literal("Feature"),
  geometry: geometrySchema,
  properties: z.record(z.any()),
});

const featureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(featureSchema),
});

export const sourceRouter = createTRPCRouter({
  getSource: publicProcedure
    .input(z.object({ id: z.enum(["lines", "stations"]) }))
    .output(featureCollectionSchema)
    .query(async ({ input }) => {
      console.log(process.cwd());
      const jsonDirectory = path.join(process.cwd(), "", "data/dc-metro");
      const fileContents = await fs.readFile(
        jsonDirectory + `/${input.id}.json`,
        "utf8",
      );
      let parsed: z.infer<typeof featureCollectionSchema>;
      try {
        parsed = JSON.parse(fileContents) as z.infer<
          typeof featureCollectionSchema
        >;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse JSON",
        });
      }

      const processed = featureCollectionSchema.safeParse(parsed);
      if (!processed.success) {
        console.error("Reason", processed.error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse JSON",
        });
      }
      return parsed;
    }),
});
