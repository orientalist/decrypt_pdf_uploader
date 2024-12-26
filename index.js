const PDF = require("pdfkit-table");
const AWS = require('aws-sdk');
const got = require('got');
const fetch = require('node-fetch');

exports.handler = async (event) => {
    const SVID = event.queryStringParameters.svid;
    const HASH = event.queryStringParameters.hash;
    const img_str = event.queryStringParameters.img;
    const decrypt_api = `https://abc.com?svid=${SVID}&hash=${HASH}`;
    const resp_decrypt = await fetch(decrypt_api);
    const data = await resp_decrypt.json();
    const surveyData = data.result;

    let pdfData = null;
    const buffers = [];
    const doc = new PDF({ margin: 30, size: 'A4' });
    doc.on('data', buffers.push.bind(buffers));
    doc.fontSize(16);
    const fileName = `${data.id}.pdf`;
    await createPDF(fileName, doc, surveyData.map(s => [s.subject, s.answer[0]]), img_str);

    doc.on('end', async () => {
        //IAM 身分資訊
        AWS.config.update({
            credentials: {
                accessKeyId: '',
                secretAccessKey: ''
            }
        });
        //IAM region 資訊
        AWS.config.update({
            region: ''
        });
        const workdocs = new AWS.WorkDocs();
        pdfData = Buffer.concat(buffers);
        await start(workdocs, fileName, pdfData);
    });
}

async function createPDF(doc, row, img) {
    try {
        const table = {
            title: 'Survey Result',
            headers: ['Question', 'Answer'],
            rows: row
        };

        await doc.table(table, { width: 300 });
        await doc.text('This is your signature:');
        await doc.image(img);
        await doc.end();

        return doc;
    } catch (e) {
        console.log(e);
    }
};

const describeUser = async (workdocs) => {
    //取得 workdocs 上某位使用者的資訊
    const user = await workdocs.describeUsers({
        OrganizationId: '',
        Query: ''
    }).promise();

    return user;
}

const initUpload = async ({ workdocs, folderID, filename }) => {
    try {
        const contentType = "application/octet-stream";
        const initResult = await workdocs.initiateDocumentVersionUpload({
            ParentFolderId: folderID,
            Name: filename,
            ContentType: contentType,
            ContentCreatedTimestamp: new Date(),
            ContentModifiedTimestamp: new Date()
        }).promise();
        const documentId = initResult.Metadata.Id;
        const versionId = initResult.Metadata.LatestVersionMetadata.Id;
        const { UploadUrl, SignedHeaders } = initResult.UploadMetadata;
        console.log("initUpload complete");
        return {
            documentId,
            versionId,
            uploadUrl: UploadUrl,
            signedHeaders: SignedHeaders
        };
    } catch (e) {
        console.log('failed initUpload', e);
        throw e;
    }
}

const uploadFile = async ({ filename, stream, signedHeaders, uploadUrl }) => {
    try {
        console.log('reading file stream');
        const fileStream = stream;
        console.log('preparing form data');
        const extendParams = {
            headers: signedHeaders
        };
        console.log('got extendParams', extendParams);
        const client = got.extend(extendParams);
        await client.put(uploadUrl, {
            body: fileStream
        });
        console.log('upload complete');
    } catch (e) {
        console.log('failed uploadFile', e);
        throw e;
    }
}

const updateVersion = async ({ workdocs, documentId, versionId }) => {
    try {
        await workdocs.updateDocumentVersion({
            DocumentId: documentId,
            VersionId: versionId,
            VersionStatus: 'ACTIVE'
        }).promise();
        console.log('document version updated');
    } catch (e) {
        console.log('failed updateversion', e);
        throw e;
    }
}

const start = async (workdocs, filename, stream) => {
    try {
        const user = await describeUser(workdocs);
        const rootFoldId = user.Users[0].RootFolderId;

        const {
            documentId,
            versionId,
            uploadUrl,
            signedHeaders
        } = await initUpload({ workdocs: workdocs, folderID: rootFoldId, filename });
        await uploadFile({ filename, stream, signedHeaders, uploadUrl });
        await updateVersion({ workdocs, documentId, versionId });
    } catch (e) {
        console.error(e);
    }
}

