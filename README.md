# excel-json-table

프로그램 목적: 유저가 엑셀파일을 업로드 하면 엑셀 파일을 claude가 분석해서 원하는 정보를 json 형태로 추출. 추출한 정보를 table 형식으로 화면에 출력. 유저가 제대로 출력되었는지 확인 후 clickup에 task 등록까지 할 수 있는 웹사이트 개발. 

전체 프로세스:
1. 엑셀 파일 업로드
2. 파일 내부 row 수가 20개가 넘으면 20개씩 나누어서 전체 작업 진행
3. claude가 파일 분석 및 정보 추출. claude의 출력은 json 형태로 함.
4. claude로 부터 받은 json 형태의 데이터를 화면에 출력. 
4. 1. 작업 한번에 20개씩 이므로 한 화면에는 20개씩 테이블 형태로 출력. 
4. 2. 20개씩 작업이 진행 될 수록 page가 생기면서 화면이 업데이트 됨.
5. 각 페이지 마다 유저가 claude로 부터 데이터 추출이 제대로 되었는지 확인할 수 있어야 함. 
6. 테이블 아래에는 "클릭업 등록" 버튼이 존재하여 정보 확인한 유저가 클릭업에 task를 추가할 수 있음.
--
클릭업에 task 생성을 위해 clickup_create_task.py 참고. 
ClickUp_API_Key="pk_5820157_B5LGNDKQWWTTNBHUU6Z3NTZWNXB1K7T3"
list_id=3747198
creator_email=sangki@seoju.me
clickup_create_task.py
"""
from contextlib import contextmanager
from numpy import NaN
from pyasn1.type.univ import Null
import pandas as pd
from pymysql import NULL
import requests
import json
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import null
import db
import datetime
from db import session
from model import UserInfo, ProductDataTable
import time


def call_clickup_api(method: str, url: str, user_email, json_data=None):
    session = db.Session()
    try:
        user = session.query(UserInfo).filter(
            UserInfo.클릭업_로그인_ID == user_email).first()
        headers = {'Authorization': user.ClickUp_API_Key}
    except Exception as e:
        print('예외가 발생했습니다.', e)
    finally:
        session.close()

    if json_data == None:
        response = requests.request(method, url, headers=headers)
    else:
        response = requests.request(
            method, url, headers=headers, json=json_data)

    return response


def create_task(list_id, creator_email, amp_product_code=None, append_all_items=False):

    url = f'https://api.clickup.com/api/v2/list/{list_id}/task'

    session = db.Session()
    try:
        user = session.query(UserInfo).\
            filter(UserInfo.클릭업_로그인_ID == creator_email).first()
        headers = {'Authorization': user.ClickUp_API_Key}
        if append_all_items == True:
            product_info = session.query(ProductDataTable)
            sleep_time = 1.8

        elif append_all_items == False:
            product_info = session.query(ProductDataTable).filter(
                ProductDataTable.서주_제품코드 == amp_product_code)
            sleep_time = 0.01

        df = pd.read_sql(product_info.statement, session.bind)

        for i in range(len(df)):
            json_body = {
                'name': f'[{df.제조사[i]}] #{df.서주_제품코드[i]}({df.제조사_제품코드[i]}), {df.제품명[i]}, {df.규격[i]} {df.단위[i]}',
                'status': '판매 업무 종결',
                "description": df["적요"][i],
                'custom_fields': [
                        {'id': "fe7564a3-04ab-4735-bfdf-8459aad311da",
                            'value': df["서주_제품코드"][i]},
                        {'id': "e2e3eaff-fc7f-4f49-8df4-77bca1c6250e",
                            'value': int(df["매입가"][i])},
                        {'id': "f54b69c1-2045-4c26-9e1c-baab9f8468dc",
                            'value': int(df["공식_소비자가"][i])},
                        {'id': "f9810caa-fe40-4f29-a7f5-21d415ee8b38",
                            'value': df["제조사"][i]},
                        {'id': "ae46d932-b732-4103-8a33-63f5f95ca8dd",
                            'value': df["제조사_제품코드"][i]},
                        {'id': "48727cb8-3b41-4b25-8e00-fe2bed8b455d",
                            'value': df["제품명"][i]},
                        {'id': "7b154f13-035d-4cd9-af30-8a76d62f70d7",
                            'value': df["규격"][i]},
                        {'id': "26e0da79-7ad4-4d08-9407-45a801bd6cf9",
                            'value': df["단위"][i]},
                        {'id': "4cdaacc7-6de0-4bfc-9296-edcc4825b986",
                            'value': df["CAS"][i]}
                ]
            }

            response = requests.request(
                'post', url, headers=headers, json=json_body)
            print(str(response.status_code) + ', ' + str(i))
            time.sleep(sleep_time)
    except Exception as e:
        print('예외가 발생했습니다.', e)
    finally:
        session.close()
"""
--
Claude에 사용되는 프롬프트는 아래와 같음.
PROMPT = '''
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
'''



## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React and Chakra UI.

- Vite
- React
- Chakra UI

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/excel-json-table.git
cd excel-json-table
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
