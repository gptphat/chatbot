import { test, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { getAndMatchQuery } from '@/utils/elastic';

test('qna_data_add', async () => {
    const csvFilePath = path.join(process.cwd(), '../crawler', 'data_add.csv');
    try {
        const fileContent = await fs.readFile(csvFilePath, 'utf-8');
        const parsedData = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true
        }).data;
        let count = 0;
        const results = await Promise.all(parsedData.map(async (item: any) => {
            const result = await getAndMatchQuery(item['Câu hỏi'], "qna", ['q']);
            return { item, result };
        }));
        results.forEach(({ item, result }) => {
            if (item['Câu trả lời'] === result["text"]) {
                count++;
            }
        });
        console.log(count / results.length);
        expect(count / results.length >= 1).toBe(true);
    } catch (error) {
        console.log("Error ", error);
    }
})

// test('qna_budsas', async () => {
//     const csvFilePath = path.join(process.cwd(), '../crawler', 'data.csv');
//     try {
//         const fileContent = await fs.readFile(csvFilePath, 'utf-8');
//         const parsedData = Papa.parse(fileContent, {
//             header: true,
//             skipEmptyLines: true
//         }).data;
//         let count = 0;
//         const results: any[] = [];
//         const batchSize = 100;
//         for (let i = 0; i < parsedData.length; i += batchSize) {
//             const data = parsedData.slice(i, i + batchSize);
//             await Promise.all(data.map(async (item: any) => {
//                 const result = await getAndMatchQuery(item['Câu hỏi'], "qna_budsas", ['q']);
//                 results.push({ item, result });
//                 return;
//             }));
//             console.log("batch ", i)
//         }
//         results.forEach(({ item, result }) => {
//             if (item['Câu hỏi'] === result.question) {
//                 count++;
//             }
//             else {
//                 console.log("Query: ", item['Câu hỏi'], " Result: ", result.question)
//             }
//         });
//         console.log("Ok ", count / results.length);
//         console.log("Count wrong ", results.length - count);
//         expect(count / results.length > 0.95).toBe(true);
//     } catch (error) {
//         console.log("Error ", error);
//     }
// })