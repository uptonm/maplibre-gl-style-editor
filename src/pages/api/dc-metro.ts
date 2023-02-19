import path from "path";
import { promises as fs } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

interface DCMetroFeatureRequest extends NextApiRequest {
  query: {
    dataset: "lines" | "stations";
  };
}

export default async function handler(
  req: DCMetroFeatureRequest,
  res: NextApiResponse
) {
  //Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data/dc-metro");
  //Read the json data file data.json
  const fileContents = await fs.readFile(
    jsonDirectory + `/${req.query.dataset}.json`,
    "utf8"
  );
  //Return the content of the data file in json format
  res.status(200).json(JSON.parse(fileContents));
}
