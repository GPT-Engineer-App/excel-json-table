import React, { useState } from "react";
import { Box, Button, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, Flex, Spacer, useToast } from "@chakra-ui/react";
import { FaFileExcel, FaPlus } from "react-icons/fa";

const ITEMS_PER_PAGE = 20;

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

    // TODO: 실제 Claude API 호출하여 엑셀 파일 분석 및 정보 추출
    // 예시로 더미 데이터 사용
    const dummyData = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 100000),
    }));

    setExtractedData(dummyData);
    setCurrentPage(1);
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
