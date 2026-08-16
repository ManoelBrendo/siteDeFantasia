import crypto from "node:crypto";
import { config } from "./config.mjs";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const hmac = (key, value, encoding) => crypto.createHmac("sha256", key).update(value).digest(encoding);

const amazonSearchUrl = (query) => {
    const url = new URL(`https://${config.amazon.marketplace}/s`);
    url.searchParams.set("k", query);

    if (config.amazon.partnerTag) {
        url.searchParams.set("tag", config.amazon.partnerTag);
    }

    return url.toString();
};

const getAmzDate = () => {
    const iso = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    return {
        amzDate: iso,
        dateStamp: iso.slice(0, 8)
    };
};

const getSigningKey = (dateStamp) => {
    const dateKey = hmac(`AWS4${config.amazon.secretKey}`, dateStamp);
    const regionKey = hmac(dateKey, config.amazon.region);
    const serviceKey = hmac(regionKey, "ProductAdvertisingAPI");
    return hmac(serviceKey, "aws4_request");
};

const normalizePaapiItems = (items = []) => {
    return items.map((item) => ({
        asin: item.ASIN,
        title: item.ItemInfo?.Title?.DisplayValue || "Titulo nao informado",
        detailPageUrl: item.DetailPageURL || amazonSearchUrl(item.ASIN || ""),
        image: item.Images?.Primary?.Medium?.URL || item.Images?.Primary?.Large?.URL || "",
        price: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount
            || item.Offers?.Listings?.[0]?.Price?.DisplayAmount
            || "",
        byline: item.ItemInfo?.ByLineInfo?.Contributors?.map((entry) => entry.Name).join(", ") || ""
    }));
};

export const searchAmazon = async ({ query, itemCount = 6 }) => {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
        throw Object.assign(new Error("Informe uma busca."), { status: 400 });
    }

    const configured = config.amazon.accessKey && config.amazon.secretKey && config.amazon.partnerTag;

    if (!configured) {
        return {
            mode: "fallback",
            configured: false,
            message: "Credenciais Amazon nao configuradas. Use o link afiliado/fallback enquanto a API oficial nao estiver pronta.",
            searchUrl: amazonSearchUrl(cleanQuery),
            items: []
        };
    }

    const payload = JSON.stringify({
        Keywords: cleanQuery,
        ItemCount: Math.min(Math.max(Number(itemCount) || 6, 1), 10),
        Marketplace: config.amazon.marketplace,
        PartnerTag: config.amazon.partnerTag,
        PartnerType: "Associates",
        Resources: [
            "Images.Primary.Medium",
            "ItemInfo.ByLineInfo",
            "ItemInfo.Title",
            "OffersV2.Listings.Price"
        ],
        SearchIndex: "Books"
    });

    const { amzDate, dateStamp } = getAmzDate();
    const canonicalHeaders = [
        "content-encoding:amz-1.0",
        "content-type:application/json; charset=utf-8",
        `host:${config.amazon.host}`,
        `x-amz-date:${amzDate}`,
        "x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems"
    ].join("\n");
    const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
    const canonicalRequest = [
        "POST",
        "/",
        "",
        `${canonicalHeaders}\n`,
        signedHeaders,
        hash(payload)
    ].join("\n");
    const credentialScope = `${dateStamp}/${config.amazon.region}/ProductAdvertisingAPI/aws4_request`;
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        credentialScope,
        hash(canonicalRequest)
    ].join("\n");
    const signature = hmac(getSigningKey(dateStamp), stringToSign, "hex");
    const authorization = `AWS4-HMAC-SHA256 Credential=${config.amazon.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${config.amazon.host}/`, {
        method: "POST",
        headers: {
            "content-encoding": "amz-1.0",
            "content-type": "application/json; charset=utf-8",
            "x-amz-date": amzDate,
            "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
            authorization
        },
        body: payload
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        return {
            mode: "paapi",
            configured: true,
            error: data.Errors?.[0]?.Message || "A Amazon nao respondeu com sucesso.",
            searchUrl: amazonSearchUrl(cleanQuery),
            items: []
        };
    }

    return {
        mode: "paapi",
        configured: true,
        searchUrl: amazonSearchUrl(cleanQuery),
        items: normalizePaapiItems(data.SearchResult?.Items || [])
    };
};
