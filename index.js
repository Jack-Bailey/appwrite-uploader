const appwrite = require("./modules/appwrite");
const express = require("express");
const app = express();
var bodyParser = require("body-parser");
var multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "tmp/" });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

require("dotenv").config("../.env");

function generateString(length) {
	var characters = process.env.SLUG_CHARS;
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

app.get("*", async function (req, res) {
	var slug = req.url.slice(1); // Removes '/' from slug
	// Ignores extensions in request
	if (slug.includes(".")) {
		slug = slug.slice(0, slug.lastIndexOf(".")) || slug;
	}

	const response = await appwrite.getDocument(slug);

	if (!response.success) return res.status(200).send("404");
	if (!response.data.isFile) return res.status(302).redirect(response.data.destinationURL);

	// Ensures images and videos are previewed and other files are downloaded

	const file = await appwrite.getFile(response.data.fileID);

	var head = {
		"Content-Type": file.mimeType,
	};

	if (!["image", "video"].some((type) => file.mimeType.includes(type))) head["Content-Disposition"] = `attachment; filename="${file.name}"`;

	// applies proper disposition and content type headers for embeds
	res.writeHead(200, head);

	res.status(200).end(Buffer.from(file.file, "binary"));
});

app.post("/upload", upload.single("sharex"), async function (req, res) {
	const secret = req.body.secret;

	// secret handling
	if (secret !== process.env.SECRET) {
		if (req.file) {
			// deletes files uploaded if auth failed - could be a security issue it being downloaded at all? ¯\_(ツ)_/¯
			fs.unlinkSync(req.file.destination + req.file.filename);
		}
		return res.status(401).send("Invalid secret");
	}

	const isFile = req.body.url ? false : true;

	var slug = req.body.slug || generateString(isFile ? process.env.SLUG_LENGTH_FILE : process.env.SLUG_LENGTH_URL);

	var slugExists;

	while (slugExists !== false) {
		slugExists = (await appwrite.getDocument(slug)).success;
		if (slugExists) slug = generateString(isFile ? process.env.SLUG_LENGTH_FILE : process.env.SLUG_LENGTH_URL);
	}

	var document = {
		isFile,
		slug,
	};

	var extension = "";

	if (isFile) {
		// returns certain extensions - useful for proper embedding into sites like discord
		if (process.env.RETURN_CERTAIN_EXTENSIONS == "true" || process.env.RETURN_ALL_EXTENSIONS == "true") {
			if (["gif", "mp4"].includes(req.file.originalname.split(".").at(-1)) || process.env.RETURN_ALL_EXTENSIONS == "true") {
				extension = `.${req.file.originalname.split(".").at(-1)}`;
			}
		}

		try {
			var response = await appwrite.uploadFile(req.file.destination + req.file.filename);
		} catch (e) {
			return res.status(500).json({
				success: false,
				message: "Upload failed",
			});
		}

		fs.unlinkSync(req.file.destination + req.file.filename); // Remove file locally after upload
		var fileID = response.$id;

		document.fileID = fileID;
	} else {
		// allows local urls such as
		if (!req.body.url.startsWith("http")) {
			document.destinationURL = "http://" + process.env.DOMAIN + "/" + req.body.url;
		} else {
			document.destinationURL = req.body.url;
		}
	}

	try {
		await appwrite.createDoc(document);
	} catch {
		return res.status(500).send("Internal server error");
	}

	return res.status(200).send(process.env.DOMAIN + "/" + slug + extension);
});

app.listen(process.env.PORT, () => {
	// removes any remaining tmp files after start
	fs.readdirSync("./tmp").forEach((file) => {
		fs.unlinkSync(`./tmp/${file}`);
	});
	console.log("Server running on port " + process.env.PORT);
});
