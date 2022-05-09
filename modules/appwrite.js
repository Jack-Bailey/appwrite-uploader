const sdk = require("node-appwrite");
const client = new sdk.Client();
var mime = require("mime-types");

require("dotenv").config("../.env");
client.setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT).setKey(process.env.APPWRITE_KEY);

let database = new sdk.Database(client);
let storage = new sdk.Storage(client);

async function getDocuments() {
	const response = await database.listDocuments(process.env.APPWRITE_COLLECTION);
	return response;
}

async function getDocument(slug) {
	const response = await database.listDocuments(process.env.APPWRITE_COLLECTION, [sdk.Query.equal("slug", slug)]);

	return {
		success: response.total ? true : false,
		data: response.total
			? response.documents.map((item) => {
					return {
						slug: item.slug,
						isFile: item.isFile,
						fileID: item.fileID,
						destinationURL: item.destinationURL,
					};
			  })[0]
			: null,
	};
}

async function uploadFile(file) {
	let promise = await storage.createFile(process.env.APPWRITE_BUCKET, "unique()", file);
	return promise;
}

async function getFile(fileID) {
	const fileData = await storage.getFile(process.env.APPWRITE_BUCKET, fileID);

	var preview = ["image/png", "image/jpg"].includes(fileData.mimeType);

	var file = preview
		? await storage.getFilePreview(process.env.APPWRITE_BUCKET, fileID)
		: await storage.getFileDownload(process.env.APPWRITE_BUCKET, fileID);

	return {
		file,
		mimeType: fileData.mimeType,
		name: `${fileData.name}.${mime.extension(fileData.mimeType)}`,
	};
}

async function createDoc(doc) {
	const response = database.createDocument(process.env.APPWRITE_COLLECTION, "unique()", doc);
	return response;
}

module.exports = {
	client,
	getDocuments,
	getDocument,
	getFile,
	uploadFile,
	createDoc,
};
