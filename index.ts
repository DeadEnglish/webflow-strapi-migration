import csv from "csv-parser";
import { createReadStream } from "node:fs";

const strapiApiKey = "strapi_api_key";

const faqFile = "faqs.csv";

const parsedFileName = "parsedFaqs.json";

/** normalise the headers as webflow allows them to be capitalised strings with spaces*/
function normaliseHeader(header: string) {
  return header.replace(/ /g, "_").toLowerCase();
}

/** parse CSV to json. currently using FAQs but can also be used for blogs */
function parseFaqs() {
  const result: unknown[] = [];

  // read csv file
  createReadStream(faqFile)
    // Normalise headers to be lower case and remove spaces
    .pipe(csv({ mapHeaders: ({ header }) => normaliseHeader(header) }))
    // when we have a data event, push to the results array
    .on("data", (data) => result.push(data))
    // on stream end, write results to the file
    // Currently we only write the first 2 results as this file is massive
    .on("end", () => {
      Bun.write(parsedFileName, JSON.stringify([result[0], result[1]]));
    });
}

/** import FAQs into strapi using the api */
async function importFaqs() {
  // read file
  const file = Bun.file(parsedFileName);

  // get json from file
  const blogs = await file.json();

  // using local host but obivously url can change
  fetch("http://127.0.0.1:1337/api/faqs", {
    method: "post",
    headers: {
      "content-type": "application/json",
      Authorization: `bearer ${strapiApiKey}`,
    },
    body: JSON.stringify({
      data: {
        title: blogs[0].Name,
        old_content: blogs[0]?.["Post Body"] || "could not find body",
      },
    }),
  })
    .then((res) => console.log(res))
    .catch((e) => console.log(e));
}

parseFaqs();
