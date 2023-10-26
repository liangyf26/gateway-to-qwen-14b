const TELEGRAPH_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
let LOGFLARE_API_KEY = 'OX9_n1kPX8_p';
let LOGFLARE_SOURCE_ID = 'fd15aaf1-8dec-4c6a-bd44-56e57b0c93e2';
let headersStr = '';
let bodyStr = '';

export default {
  async fetch(request, env) {
      const NewResponse = await handleRequest(request)
      return NewResponse
  },
};


function traverseJSON(obj, parentKey = '') {
    // var tempStr = '';
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseJSON(obj[key], parentKey + key + '.');
      } else {
        bodyStr += `${parentKey}${key}: ${obj[key]}\n`;
      }
    }
    // return tempStr
}

function traverseJSON(obj, parentKey = '') {
    let tempStr = ''; 
  
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        tempStr += traverseJSON(obj[key], parentKey + key + '.');
      } else {
        tempStr += `${parentKey}${key}: ${obj[key]}\n`;
      }
    }
  
    return tempStr;
}

async function sendLogToLogflare(logData) {
    const url = new URL('https://api.logflare.app/logs');
    url.searchParams.append('source', LOGFLARE_SOURCE_ID);

    let init = {
      method: 'POST',
      headers: {
        'X-API-KEY': LOGFLARE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {'gateway': 'cloudflare', 'app': 'qwen'},
        event_message: logData,
      }),
    };
  
    await fetch(url, init);
};

async function handleRequest(request) {
  const headers_Origin = request.headers.get("Access-Control-Allow-Origin") || "*"
  
  // 我们直接使用TELEGRAPH_URL， 不再需要 URL(request.url)
  const newURL = TELEGRAPH_URL;

  // 创建一个新的 Headers 对象复制原来的 headers，然后添加你的 Authorization
  const newHeaders = new Headers(request.headers);
//   newHeaders.set('Authorization', 'Bearer sk-ad7cf22cf6b146099f59735c85ec7d33'); 

  // 日志输出
  sendLogToLogflare('url: ' + newURL);

  let newBody = request.body;
//   if (!("input" in newBody)) {
//     newBody = {
//         model: newBody.model,
//         input: {
//             messages: newBody.messages
//         }
//     };
//   }

  bodyStr = traverseJSON(newBody);
  sendLogToLogflare(bodyStr);

  const modifiedRequest = new Request(newURL, {
    headers: newHeaders,
    method: request.method,
    body: newBody,
    redirect: 'follow'
  });
  const response = await fetch(modifiedRequest);
  const modifiedResponse = new Response(response.body, response);
  // 添加允许跨域访问的响应头
  modifiedResponse.headers.set('Access-Control-Allow-Origin', headers_Origin);
  return modifiedResponse;
}
