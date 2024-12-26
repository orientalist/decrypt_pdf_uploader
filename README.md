# Node.js PDF Generation and Upload to AWS WorkDocs

## 簡介
這個專案實現了一個無伺服器的 Node.js 函數，該函數能夠從 API 獲取調查數據，生成 PDF 檔案並將其上傳至 AWS WorkDocs。此專案采用了 PDFKit 和 AWS SDK 等工具。

## 功能
- 從指定的 API 獲取調查數據。
- 根據獲取的數據生成 PDF 報告。
- 將生成的 PDF 檔案安全地上傳至 AWS WorkDocs。
- 包括用戶身份驗證及文件版本管理功能。

## 安裝與使用方式
1. **克隆此專案**
   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. **安裝依賴項**
   使用 npm 安裝必需的依賴模組：
   ```bash
   npm install
   ```

3. **配置 AWS 憑證**
   確保在代碼中設置有效的 AWS 憑證以及所需的 IAM 權限，使其能夠上傳至 WorkDocs。

4. **運行函數**
   此函數應該在 AWS Lambda 上運行，您可以根據 AWS 的文件說明來進行部署。確保設置正確的環境變數以支持 API 調用和 AWS 設定。

## 必要的依賴模組清單
- `pdfkit-table`
- `aws-sdk`
- `got`
- `node-fetch`

請使用以下命令安裝這些依賴：
```bash
npm install pdfkit-table aws-sdk got node-fetch
```

## 授權條款
本專案基於 MIT 許可證。請查看 LICENSE 文件以獲取詳細資訊。