
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


# FILTER CONDITION (ITEMS) FETCHING API
Generated from cURL: curl 'https://crm-api.shikho.com/api/v1/filters/3169' 
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
  -H 'x-log-ref-id: crm-web-0041-1768373138431'


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


# OLD GROUP BULK DISTRIBUTION API
Generated from cURL: curl 'https://crm-api.shikho.com/api/v1/leads/bulk-updates?search=owner_id:3;product_id:1;mobile:8801840413614&conditions=owner_id:in;product_id:in;mobile:=&join=AND'
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
-H 'x-log-ref-id: crm-web-0041-1768343217653'
--data-raw '{"groupIds":[35],"leads_per_campaign":null,"lead_per_owner":1,"field_key":"owner_id","name":"Bulk Distro API Testing","filter_id":3169,"type_id":1,"items":[{"join":"AND","field":"owner_id","value":[3],"condition":"in","displayName":"Latest Owner Is CRM Agent"},{"join":"AND","field":"product_id","value":[1],"condition":"in","displayName":"Vertical Is Shikho"},{"join":"AND","field":"mobile","value":"8801840413614","condition":"=","displayName":"Mobile Is 8801840413614"}]}'


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


# OLD AGENT SPECIFIC DISTRIBUTION API
Generated from cURL: curl 'https://crm-api.shikho.dev/api/v1/leads/bulk-updates?search=owner_id%3A3%3Bproduct_id%3A1%3Blead_stage_id%3A1%3Bcf_class%3AC5&conditions=owner_id%3Ain%3Bproduct_id%3Ain%3Blead_stage_id%3Ain%3Bcf_class%3Ain&join=AND' 
  -X 'PUT' 
  -H 'accept: application/json' 
  -H 'accept-language: en-US,en;q=0.9,bn;q=0.8' 
  -H 'authorization: Bearer XXXXXXXX' 
  -H 'content-type: application/json' 
  -H 'origin: https://crm.shikho.dev' 
  -H 'priority: u=1, i' 
  -H 'referer: https://crm.shikho.dev/' 
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' 
  -H 'sec-ch-ua-mobile: ?0' 
  -H 'sec-ch-ua-platform: "macOS"' 
  -H 'sec-fetch-dest: empty' 
  -H 'sec-fetch-mode: cors' 
  -H 'sec-fetch-site: same-site' 
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' 
  -H 'x-log-ref-id: crm-web-0044-1768386650153' 
  --data-raw '{"agentIds":[1026,1027,827],"leads_per_campaign":null,"lead_per_owner":2,"field_key":"owner_id","name":"Distro API Test - C5","filter_id":773,"type_id":1,"items":[{"join":"AND","field":"owner_id","value":[3],"condition":"in","displayName":"Latest Owner Is CRM Agent"},{"join":"AND","field":"product_id","value":[1],"condition":"in","displayName":"Vertical Is Shikho"},{"join":"AND","field":"lead_stage_id","value":[1],"condition":"in","displayName":"Latest Stage Is Leads"},{"join":"AND","field":"cf_class","value":["C5"],"condition":"in","displayName":"Class Is Class 5"}]}'