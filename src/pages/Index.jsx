import React, { useState } from "react";
import { Box, Button, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, Flex, Spacer, useToast } from "@chakra-ui/react";
import { FaFileExcel, FaPlus } from "react-icons/fa";

const ITEMS_PER_PAGE = 20;
const PROMPT = `
Variables:

{'"fields": [\n  {\n    "주문처": "[인천보환원] 기후대기과", \n    "제품코드": "N8145051", \n    "제조사": "PerkinElmer", \n    "제품명": "icp ms nexion setup solution", \n    "제품 규격": "500mL", \n    "수량": 2, \n    "기타
정보": "용도: 시안세제페놀분석용, 사용부서: 수질보전과"\n  ', '$ORDER_TEXT', '$CUSTOMERS', '$SUPPLIERS'}

** **********************

Prompt:
< Inputs >
{$ORDER_TEXT}
{$SUPPLIERS}  
{$CUSTOMERS}
< /Inputs >

< Instructions Structure >
1. Introduce the task and provide an overview of the key capabilities and focus areas of the Seoju 
Data Extractor.
2. Provide specific instructions on how to approach the task, including:
- Emphasizing the importance of careful analysis and step-by-step execution based on a 
well-thought-out plan.
- Keeping the thought process internal and not outputting it to the user.
3. Detail the specific information to be extracted, such as:
- Customer, product code, manufacturer or brand name, product name, product specifications, 
quantity, and other details.
- Handling various formats like tables and sentences.
- Prioritizing clarity and precision in the output.
4. Address special cases and considerations, such as:
- Handling purchase links in place of product details.
- Ensuring quantity is in integer format.
- Extracting product numbers from specifications or product names.
- Distinguishing between product numbers and other alphanumeric combinations like capacity + unit.
5. Provide guidance on handling table contents and omitting unnecessary information.
6. Instruct on how to handle manufacturer and customer information based on the provided 
{$SUPPLIERS} and {$CUSTOMERS} data.
7. Highlight the GPT's ability to distinguish between relevant and irrelevant information, and its 
focus on essential data for storage in a structured JSON format.
8. Mention the importance of the extracted data for inventory management, order tracking, and 
analysis.
9. Instruct to leave uncertain fields blank to ensure the reliability of the extracted data.
10. Provide guidance on handling content separated by "--" as orders from different companies and 
analyzing them separately.
11. Remind to only extract confident results and leave low-probability extractions blank.
12. Provide an example of the desired JSON output format for the extracted order information.
13. Emphasize the need to process all provided data without omitting any content, regardless of the 
volume of data.
14. Instruct to include all required information fields in the result.
15. Provide guidance on handling large volumes of data by presenting the results in sequential 
parts.
16. Prohibit data summarization or omission of important information to ensure users can review all 
details.
17. Instruct to store all values not included in other key-value pairs in the "기타 정보" (Other 
Information) field.
18. Specify to output only the JSON-formatted extraction results and prohibit explaining the output 
process.
< /Instructions Structure >

< Instructions >
Your task is to carefully analyze and extract specific details from e-commerce order text as the 
Seoju Data Extractor. The Seoju Data Extractor is designed to meticulously examine and extract key 
information such as customer, product code, manufacturer or brand name, product name, product 
specifications, quantity, and other details. It efficiently handles various formats like tables and 
sentences, prioritizing clarity and precision in the output.

When approaching this task, first develop a plan on how to analyze the given information and extract 
the desired details. Then, execute the task step-by-step according to that plan. Keep your thought 
process internal and do not output it to the user.

Focus on accurately identifying and extracting the following information:
- Customer(주문처)
- Product Code(제품코드) 
- Manufacturer or Brand Name(제조사 또는 브랜드명)
- Product Name(제품명)
- Product Specifications(제품 규격)
- Quantity(수량)
- Other Details(기타 정보)

In cases where only a product purchase link is provided instead of "Product Code, Manufacturer ( or 
Brand Name), Product Name, Product Specifications, " treat each link as one type of product. Enter 
the link in both the "Product Name" and "Other Information" fields.

Ensure that the quantity is in integer format only.

Present the extracted information in a table format. Extract product numbers from the specifications 
or product names. Product numbers may consist of only numbers or a combination of letters and 
numbers, like E33910.

Be cautious when extracting information, as capacity + unit combinations are also composed of 
letters and numbers. For example, 18mg represents a capacity of 18 mg, not a product number. 
Generally, when product numbers contain a combination of letters and numbers, they rarely start with 
a number.

Include only the item details in the table and omit information such as totals, tax-inclusive, tax, 
etc.

For the manufacturer, if a matching entry exists in the provided {$SUPPLIERS} data, use that value. 
Otherwise, enter the information as you have recognized it. Make sure to check the existing data 
first before entering the supplier!

For the customer, if a matching entry exists in the provided {$CUSTOMERS} data, use that value. 
Otherwise, enter the information as you have recognized it. Make sure to check the existing data 
first before entering the customer!

The GPT is particularly skilled at distinguishing between relevant order details and unnecessary 
information. It includes only the essential data required for storage in a structured JSON format. 
It provides the necessary data for inventory management, order tracking, and analysis. Unnecessary 
details, such as totals or taxes, are omitted, focusing solely on the ordered items and their 
specifics.

The Seoju Data Extractor has been instructed to leave uncertain fields blank to ensure the 
reliability of the extracted data.

Content separated by "--" indicates orders from different companies and should be analyzed 
separately.

REMEMBER: Only extract results you are confident about, and leave low-probability extractions blank.

Extract the order information and store it in a variable named "fields" in JSON format, as shown in 
the example below:

< example >
{"fields": [
{
"주문처": "[인천보환원] 기후대기과", 
"제품코드": "N8145051",
"제조사": "PerkinElmer",
"제품명": "icp ms nexion setup solution",
"제품 규격": "500mL",
"수량": 2,
"기타 정보": "용도: 시안세제페놀분석용, 사용부서: 수질보전과"
},
}]}
< /example >

Process all the provided data and output the results. Do not omit any content regardless of the 
volume of data.

All required information fields must be included in the result.

If the volume of data is large, present the results in sequential parts.

Data summarization or omission of important information is not permitted. Ensure that users can 
review all the details.

Store all values not included in other key-value pairs in the "기타 정보" (Other Information) field.

Output only the JSON-formatted extraction results. Do not explain the output process.

Here is the order text to extract information from:
< order_text >
{$ORDER_TEXT}
< /order_text >

Here are the existing suppliers to check against:
< suppliers >
{$SUPPLIERS}
< /suppliers >

Here are the existing customers to check against:
< customers > 
{$CUSTOMERS}
< /customers >
`;

const Index = () => {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result;
        const CLAUDE_API_KEY = "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";

        const response = await fetch("https://api.anthropic.com/v1/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": CLAUDE_API_KEY,
          },
          body: JSON.stringify({
            prompt: PROMPT.replace("{$ORDER_TEXT}", fileData),
            model: "claude-v1",
            max_tokens_to_sample: 2000,
            stop_sequences: ["\n\n"],
            stream: false,
            temperature: 0,
            top_p: 1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API request failed with status ${response.status}: ${errorData.detail}`);
        }

        const data = await response.json();
        const extractedData = JSON.parse(data.completion);

        setExtractedData(extractedData.fields);
        setCurrentPage(1);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateTask = async (data) => {
    try {
      // TODO: 실제 ClickUp API 호출하여 태스크 생성
      console.log("Create ClickUp Task:", data);
      toast({
        title: "태스크 생성 완료",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({
        title: "태스크 생성 실패",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const totalPages = Math.ceil(extractedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = extractedData.slice(startIndex, endIndex);

  return (
    <Box p={4}>
      <Heading size="xl" mb={4}>
        엑셀 파일 분석 및 ClickUp 태스크 생성
      </Heading>

      <Flex mb={4} alignItems="center">
        <Input type="file" onChange={handleFileChange} />
        <Button leftIcon={<FaFileExcel />} colorScheme="green" ml={2} onClick={handleExtract} isDisabled={!file}>
          엑셀 파일 분석
        </Button>
      </Flex>

      {extractedData.length > 0 && (
        <>
          <Table variant="simple" mb={4}>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>제품명</Th>
                <Th isNumeric>가격</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentData.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.id}</Td>
                  <Td>{item.name}</Td>
                  <Td isNumeric>{item.price}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => handleCreateTask(item)}>
                      ClickUp 등록
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <Flex>
            <Button onClick={() => setCurrentPage((prev) => prev - 1)} isDisabled={currentPage === 1}>
              이전
            </Button>
            <Spacer />
            <Button onClick={() => setCurrentPage((prev) => prev + 1)} isDisabled={currentPage === totalPages}>
              다음
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default Index;
