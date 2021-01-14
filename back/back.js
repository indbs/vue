const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
//const koaRoute = require('koa-route');
const app = new Koa();
const MongoClient = require('mongodb').MongoClient;
const CURRENCIES_DETAILS_ARRAY= [
	{name: "US Dollar", code: "USD", symbol: "$", rate: 1},
	{name: "Euro", code: "EUR", symbol: "€", rate: 0.897597},
	{name: "British Pound", code: "GBP", symbol: "£", rate: 0.81755},
	{name: "Russian Ruble", code: "RUB", symbol: "₽", rate: 63.461993}
];
const KOA_OPTIONS = {
    credentials: true
};
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'don_db';

app.use(cors(KOA_OPTIONS));
app.use(koaBody());

function insertDocument(db, doc, callback) {
    const collection = db.collection('donations');
    doc.inserted = new Date();
    collection.insertOne(doc, function(err, result) {
        callback(result);
    });
  }

app.use(async ctx => {
    if (ctx.originalUrl == '/donate'){
        const incomingDonationDetails = ctx.request.body;
        if (incomingDonationDetails.amount
            && incomingDonationDetails.currency
            && incomingDonationDetails.amount > 0 
            && CURRENCIES_DETAILS_ARRAY.find(currency => currency.code == incomingDonationDetails.currency)){
                const completionPromise = new Promise((mainResolve, mainReject) => {
                    MongoClient.connect(MONGO_URL, function(err, client) {
                        const db = client.db(DB_NAME);
                        const insertionPromise = new Promise((resolve, reject) => {
                            insertDocument(db, incomingDonationDetails, function(id) {
                                resolve(id);
                                client.close();
                            });
                        });
                        insertionPromise.then(id => {
                            mainResolve(id);
                        });
                    });
                });
                return completionPromise.then(id => {
                    ctx.body = {                          
                        ok: true,
                        id: id
                    };
                });
        }
    }
});

app.listen(4001);
