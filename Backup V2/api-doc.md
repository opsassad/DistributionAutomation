
# FILTER FETCHING API
curl 'https://crm-api.shikho.com/api/v1/filters?cols=id%3Bname%3Btype_id%3Bitems&search=type_id%3A1%3Bstatus_id%3A1&conditions=type_id%3A%3D%3Bstatus_id%3A%3D&join=and&page=all&orderBy=name&sortedBy=asc' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9,bn;q=0.8' \
  -H 'authorization: Bearer XXXXXXXX' \
  -H 'origin: https://crm.shikho.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://crm.shikho.com/' \
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \
  -H 'x-log-ref-id: crm-web-0041-1768146982315'


# FETCH GROUP API
Generated from cURL: curl 'https://crm-api.shikho.com/api/v1/groups?join=or&page=1&orderBy=id&sortedBy=desc&limit=200' 
  -H 'accept: application/json' 
  -H 'accept-language: en-US,en;q=0.9,bn;q=0.8' 
  -H 'authorization: Bearer XXXXXXXX' 
  -H 'origin: https://crm.shikho.com' 
  -H 'priority: u=1, i' 
  -H 'referer: https://crm.shikho.com/' 
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' 
  -H 'sec-ch-ua-mobile: ?0' 
  -H 'sec-ch-ua-platform: "macOS"' 
  -H 'sec-fetch-dest: empty' 
  -H 'sec-fetch-mode: cors' 
  -H 'sec-fetch-site: same-site' 
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' 
  -H 'x-log-ref-id: crm-web-0041-1768215293491'


# GROUP BULK DISTRIBUTION API
Generated from cURL: curl 'https://crm-api.shikho.com/api/v1/leads/bulk-distributes' 
  -X 'PUT' 
  -H 'accept: application/json' 
  -H 'accept-language: en-US,en;q=0.9,bn;q=0.8' 
  -H 'authorization: Bearer XXXXXXXX' 
  -H 'content-type: application/json' 
  -H 'origin: https://crm.shikho.com' 
  -H 'priority: u=1, i' 
  -H 'referer: https://crm.shikho.com/' 
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' 
  -H 'sec-ch-ua-mobile: ?0' 
  -H 'sec-ch-ua-platform: "macOS"' 
  -H 'sec-fetch-dest: empty' 
  -H 'sec-fetch-mode: cors' 
  -H 'sec-fetch-site: same-site' 
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' 
  -H 'x-log-ref-id: crm-web-0041-1768215025390' 
  --data-raw '{"data":[{"type_id":1,"field_key":"owner_id","groupIds":[35],"lead_per_owner":1,"filter_id":3169,"name":"Bulk Distro API Testing"}]}'


# AGENT SPECIFIC DISTRIBUTION API
Generated from cURL: curl 'https://crm-api.shikho.com/api/v1/leads/bulk-distributes' 
  -X 'PUT' 
  -H 'accept: application/json' 
  -H 'accept-language: en-US,en;q=0.9,bn;q=0.8' 
  -H 'authorization: Bearer XXXXXXXX' 
  -H 'content-type: application/json' 
  -H 'origin: https://crm.shikho.com' 
  -H 'priority: u=1, i' 
  -H 'referer: https://crm.shikho.com/' 
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' 
  -H 'sec-ch-ua-mobile: ?0' 
  -H 'sec-ch-ua-platform: "macOS"' 
  -H 'sec-fetch-dest: empty' 
  -H 'sec-fetch-mode: cors' 
  -H 'sec-fetch-site: same-site' 
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' 
  -H 'x-log-ref-id: crm-web-0041-1768146591699' 
  --data-raw '{"data":[{"type_id":1,"field_key":"owner_id","agentIds":["256"],"lead_per_owner":1,"filter_id":3168,"name":"crm testing api"}]}'