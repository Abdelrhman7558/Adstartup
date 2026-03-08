const accessToken = 'EAAMq7S6ZBgJsBQr5OzKL21Ve3YD8R7ZBm17531iwTSww1umkcQA4ZCRGvxJTGITodW6d6xAABCbwVpzaLRAboIxPFEQ3e9nvsEeppg5AVRH4mA1uD6NbbLee5EMyx4zBoelZC9ZAx9RsuJVXURR9czByoF8nOZBdyj8ZCyHhpOkSQkw3rMNKt78fHIKLN9l';
const adAccountId = 'act_304428362989164';

const url = `https://graph.facebook.com/v21.0/${adAccountId}?fields=account_status,disable_reason,currency,amount_spent,balance,funding_source_details,owner,timezone_name&access_token=${accessToken}`;

fetch(url)
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
