#!/bin/bash

# Exit on any error
set -e

# Function to execute cURL and check for errors
run_curl() {
    echo "Executing: $1"
    if ! curl --fail -s -o /dev/null "$@"; then
        echo "Error: Failed to execute $1"
        response=$(curl -s "$@")
        echo "Error details: $response"
        exit 1
    fi
    echo "Success: $1 completed"
    #else show error message
    sleep 2  # Wait 2 seconds between requests
}

# 1. Create users
run_curl -X 'POST' \
  'http://165.232.183.161:3000/api/v1/users/create/many' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '[
  {
    "email": "admin1@agency.com",
    "password": "adminPass1",
    "role": "ADMIN",
    "profile": {
      "firstName": "Alice",
      "lastName": "Smith",
      "yearOfBirth": 1985,
      "passportSeriesAndNumber": "AA9876543",
      "email": "alice.smith@agency.com",
      "phoneNumber": "+10000000001"
    }
  },
  {
    "email": "admin2@agency.com",
    "password": "adminPass2",
    "role": "ADMIN",
    "profile": {
      "firstName": "Bob",
      "lastName": "Johnson",
      "yearOfBirth": 1980,
      "passportSeriesAndNumber": "BB1239874",
      "email": "bob.johnson@agency.com",
      "phoneNumber": "+10000000002"
    }
  },
  {
    "email": "client1@example.com",
    "password": "clientPass1",
    "role": "CLIENT",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "yearOfBirth": 1990,
      "passportSeriesAndNumber": "AB1234567",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890"
    }
  },
  {
    "email": "client2@example.com",
    "password": "clientPass2",
    "role": "CLIENT",
    "profile": {
      "firstName": "Maria",
      "lastName": "Lopez",
      "yearOfBirth": 1995,
      "passportSeriesAndNumber": "CD7654321",
      "email": "maria.lopez@example.com",
      "phoneNumber": "+1234567891"
    }
  },
  {
    "email": "client3@example.com",
    "password": "clientPass3",
    "role": "CLIENT",
    "profile": {
      "firstName": "Chen",
      "lastName": "Wei",
      "yearOfBirth": 1998,
      "passportSeriesAndNumber": "EF3456789",
      "email": "chen.wei@example.com",
      "phoneNumber": "+1234567892"
    }
  }
]
'

run_curl -X 'POST' \
  'http://165.232.183.161:3000/api/v1/countries/create/many' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "countries": [
  {"code": 4, "nameUz": "Afg‘oniston", "nameRu": "Афганистан", "nameEn": "Afghanistan", "descriptionUz": "Afg‘oniston — Janubiy Osiyodagi davlat.", "descriptionRu": "Афганистан — страна в Южной Азии.", "descriptionEn": "Afghanistan is a country in South Asia."},
  {"code": 8, "nameUz": "Albaniya", "nameRu": "Албания", "nameEn": "Albania", "descriptionUz": "Albaniya — Janubiy Yevropadagi davlat.", "descriptionRu": "Албания — страна в Южной Европе.", "descriptionEn": "Albania is a country in Southern Europe."},
  {"code": 12, "nameUz": "Jazoir", "nameRu": "Алжир", "nameEn": "Algeria", "descriptionUz": "Jazoir — Shimoliy Afrikadagi davlat.", "descriptionRu": "Алжир — страна в Северной Африке.", "descriptionEn": "Algeria is a country in North Africa."},
  {"code": 20, "nameUz": "Andorra", "nameRu": "Андорра", "nameEn": "Andorra", "descriptionUz": "Andorra — Yevropadagi kichik davlat.", "descriptionRu": "Андорра — небольшая страна в Европе.", "descriptionEn": "Andorra is a small country in Europe."},
  {"code": 24, "nameUz": "Angola", "nameRu": "Ангола", "nameEn": "Angola", "descriptionUz": "Angola — Janubiy Afrikadagi davlat.", "descriptionRu": "Ангола — страна в Южной Африке.", "descriptionEn": "Angola is a country in Southern Africa."},
  {"code": 28, "nameUz": "Antigua va Barbuda", "nameRu": "Антигуа и Барбуда", "nameEn": "Antigua and Barbuda", "descriptionUz": "Antigua va Barbuda — Karibdagi orol davlat.", "descriptionRu": "Антигуа и Барбуда — островная страна в Карибском море.", "descriptionEn": "Antigua and Barbuda is an island country in the Caribbean."},
  {"code": 32, "nameUz": "Argentina", "nameRu": "Аргентина", "nameEn": "Argentina", "descriptionUz": "Argentina — Janubiy Amerikadagi davlat.", "descriptionRu": "Аргентина — страна в Южной Америке.", "descriptionEn": "Argentina is a country in South America."},
  {"code": 51, "nameUz": "Armaniston", "nameRu": "Армения", "nameEn": "Armenia", "descriptionUz": "Armaniston — Kavkazdagi davlat.", "descriptionRu": "Армения — страна в Кавказе.", "descriptionEn": "Armenia is a country in the Caucasus."},
  {"code": 36, "nameUz": "Avstraliya", "nameRu": "Австралия", "nameEn": "Australia", "descriptionUz": "Avstraliya — Okeaniyadagi qit’a davlat.", "descriptionRu": "Австралия — континентальная страна в Океании.", "descriptionEn": "Australia is a continent country in Oceania."},
  {"code": 40, "nameUz": "Avstriya", "nameRu": "Австрия", "nameEn": "Austria", "descriptionUz": "Avstriya — Markaziy Yevropadagi davlat.", "descriptionRu": "Австрия — страна в Центральной Европе.", "descriptionEn": "Austria is a country in Central Europe."},
  {"code": 31, "nameUz": "Ozarbayjon", "nameRu": "Азербайджан", "nameEn": "Azerbaijan", "descriptionUz": "Ozarbayjon — Kavkazdagi davlat.", "descriptionRu": "Азербайджан — страна в Кавказе.", "descriptionEn": "Azerbaijan is a country in the Caucasus."},
  {"code": 44, "nameUz": "Bahamas", "nameRu": "Багамы", "nameEn": "Bahamas", "descriptionUz": "Bahamas — Karibdagi orol davlat.", "descriptionRu": "Багамы — островная страна в Карибском море.", "descriptionEn": "The Bahamas is an island country in the Caribbean."},
  {"code": 48, "nameUz": "Bahrayn", "nameRu": "Бахрейн", "nameEn": "Bahrain", "descriptionUz": "Bahrayn — Fors ko‘rfazidagi davlat.", "descriptionRu": "Бахрейн — страна в Персидском заливе.", "descriptionEn": "Bahrain is a country in the Persian Gulf."},
  {"code": 50, "nameUz": "Bangladesh", "nameRu": "Бангладеш", "nameEn": "Bangladesh", "descriptionUz": "Bangladesh — Janubiy Osiyodagi davlat.", "descriptionRu": "Бангладеш — страна в Южной Азии.", "descriptionEn": "Bangladesh is a country in South Asia."},
  {"code": 52, "nameUz": "Barbados", "nameRu": "Барбадос", "nameEn": "Barbados", "descriptionUz": "Barbados — Karibdagi orol davlat.", "descriptionRu": "Барбадос — островная страна в Карибском море.", "descriptionEn": "Barbados is an island country in the Caribbean."},
  {"code": 112, "nameUz": "Belarus", "nameRu": "Беларусь", "nameEn": "Belarus", "descriptionUz": "Belarus — Sharqiy Yevropadagi davlat.", "descriptionRu": "Беларусь — страна в Восточной Европе.", "descriptionEn": "Belarus is a country in Eastern Europe."},
  {"code": 56, "nameUz": "Belgiya", "nameRu": "Бельгия", "nameEn": "Belgium", "descriptionUz": "Belgiya — G‘arbiy Yevropadagi davlat.", "descriptionRu": "Бельгия — страна в Западной Европе.", "descriptionEn": "Belgium is a country in Western Europe."},
  {"code": 84, "nameUz": "Beliz", "nameRu": "Белиз", "nameEn": "Belize", "descriptionUz": "Beliz — Markaziy Amerikadagi davlat.", "descriptionRu": "Белиз — страна в Центральной Америке.", "descriptionEn": "Belize is a country in Central America."},
  {"code": 204, "nameUz": "Benin", "nameRu": "Бенин", "nameEn": "Benin", "descriptionUz": "Benin — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Бенин — страна в Западной Африке.", "descriptionEn": "Benin is a country in West Africa."},
  {"code": 64, "nameUz": "Butan", "nameRu": "Бутан", "nameEn": "Bhutan", "descriptionUz": "Butan — Himolaydagi davlat.", "descriptionRu": "Бутан — страна в Гималаях.", "descriptionEn": "Bhutan is a country in the Himalayas."},
  {"code": 68, "nameUz": "Boliviya", "nameRu": "Боливия", "nameEn": "Bolivia", "descriptionUz": "Boliviya — Janubiy Amerikadagi davlat.", "descriptionRu": "Боливия — страна в Южной Америке.", "descriptionEn": "Bolivia is a country in South America."},
  {"code": 70, "nameUz": "Bosniya va Gertsegovina", "nameRu": "Босния и Герцеговина", "nameEn": "Bosnia and Herzegovina", "descriptionUz": "Bosniya va Gertsegovina — Janubiy Yevropadagi davlat.", "descriptionRu": "Босния и Герцеговина — страна в Южной Европе.", "descriptionEn": "Bosnia and Herzegovina is a country in Southern Europe."},
  {"code": 72, "nameUz": "Botsvana", "nameRu": "Ботсвана", "nameEn": "Botswana", "descriptionUz": "Botsvana — Janubiy Afrikadagi davlat.", "descriptionRu": "Ботсвана — страна в Южной Африке.", "descriptionEn": "Botswana is a country in Southern Africa."},
  {"code": 76, "nameUz": "Braziliya", "nameRu": "Бразилия", "nameEn": "Brazil", "descriptionUz": "Braziliya — Janubiy Amerikadagi eng katta davlat.", "descriptionRu": "Бразилия — крупнейшая страна Южной Америки.", "descriptionEn": "Brazil is the largest country in South America."},
  {"code": 96, "nameUz": "Bruney", "nameRu": "Бруней", "nameEn": "Brunei", "descriptionUz": "Bruney — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Бруней — страна в Юго-Восточной Азии.", "descriptionEn": "Brunei is a country in Southeast Asia."},
  {"code": 100, "nameUz": "Bolgariya", "nameRu": "Болгария", "nameEn": "Bulgaria", "descriptionUz": "Bolgariya — Janubiy-Sharqiy Yevropadagi davlat.", "descriptionRu": "Болгария — страна в Юго-Восточной Европе.", "descriptionEn": "Bulgaria is a country in Southeast Europe."},
  {"code": 854, "nameUz": "Burkina-Faso", "nameRu": "Буркина-Фасо", "nameEn": "Burkina Faso", "descriptionUz": "Burkina-Faso — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Буркина-Фасо — страна в Западной Африке.", "descriptionEn": "Burkina Faso is a country in West Africa."},
  {"code": 108, "nameUz": "Burundi", "nameRu": "Бурунди", "nameEn": "Burundi", "descriptionUz": "Burundi — Sharqiy Afrikadagi davlat.", "descriptionRu": "Бурунди — страна в Восточной Африке.", "descriptionEn": "Burundi is a country in East Africa."},
  {"code": 116, "nameUz": "Kambodja", "nameRu": "Камбоджа", "nameEn": "Cambodia", "descriptionUz": "Kambodja — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Камбоджа — страна в Юго-Восточной Азии.", "descriptionEn": "Cambodia is a country in Southeast Asia."},
  {"code": 120, "nameUz": "Kamerun", "nameRu": "Камерун", "nameEn": "Cameroon", "descriptionUz": "Kamerun — Markaziy Afrikadagi davlat.", "descriptionRu": "Камерун — страна в Центральной Африке.", "descriptionEn": "Cameroon is a country in Central Africa."},
  {"code": 124, "nameUz": "Kanada", "nameRu": "Канада", "nameEn": "Canada", "descriptionUz": "Kanada — Shimoliy Amerikadagi davlat.", "descriptionRu": "Канада — страна в Северной Америке.", "descriptionEn": "Canada is a country in North America."},
  {"code": 132, "nameUz": "Kabo-Verde", "nameRu": "Кабо-Верде", "nameEn": "Cape Verde", "descriptionUz": "Kabo-Verde — Afrikaning g‘arbiy qirg‘og‘idagi orol davlat.", "descriptionRu": "Кабо-Верде — островная страна у западного побережья Африки.", "descriptionEn": "Cape Verde is an island country off the west coast of Africa."},
  {"code": 140, "nameUz": "Markaziy Afrika Respublikasi", "nameRu": "Центральноафриканская Республика", "nameEn": "Central African Republic", "descriptionUz": "Markaziy Afrika Respublikasi — Markaziy Afrikadagi davlat.", "descriptionRu": "Центральноафриканская Республика — страна в Центральной Африке.", "descriptionEn": "Central African Republic is a country in Central Africa."},
  {"code": 148, "nameUz": "Chad", "nameRu": "Чад", "nameEn": "Chad", "descriptionUz": "Chad — Markaziy Afrikadagi davlat.", "descriptionRu": "Чад — страна в Центральной Африке.", "descriptionEn": "Chad is a country in Central Africa."},
  {"code": 152, "nameUz": "Chili", "nameRu": "Чили", "nameEn": "Chile", "descriptionUz": "Chili — Janubiy Amerikadagi davlat.", "descriptionRu": "Чили — страна в Южной Америке.", "descriptionEn": "Chile is a country in South America."},
  {"code": 156, "nameUz": "Xitoy", "nameRu": "Китай", "nameEn": "China", "descriptionUz": "Xitoy — Sharqiy Osiyodagi yirik davlat.", "descriptionRu": "Китай — крупная страна в Восточной Азии.", "descriptionEn": "China is a major country in East Asia."},
  {"code": 170, "nameUz": "Kolumbiya", "nameRu": "Колумбия", "nameEn": "Colombia", "descriptionUz": "Kolumbiya — Janubiy Amerikadagi davlat.", "descriptionRu": "Колумбия — страна в Южной Америке.", "descriptionEn": "Colombia is a country in South America."},
  {"code": 174, "nameUz": "Komor", "nameRu": "Коморы", "nameEn": "Comoros", "descriptionUz": "Komor — Hind okeanidagi orol davlat.", "descriptionRu": "Коморы — островная страна в Индийском океане.", "descriptionEn": "Comoros is an island country in the Indian Ocean."},
  {"code": 178, "nameUz": "Kongo", "nameRu": "Конго", "nameEn": "Congo", "descriptionUz": "Kongo — Markaziy Afrikadagi davlat.", "descriptionRu": "Конго — страна в Центральной Африке.", "descriptionEn": "Congo is a country in Central Africa."},
  {"code": 180, "nameUz": "Kongo Demokratik Respublikasi", "nameRu": "Демократическая Республика Конго", "nameEn": "Democratic Republic of the Congo", "descriptionUz": "Kongo DR — Markaziy Afrikadagi davlat.", "descriptionRu": "ДР Конго — страна в Центральной Африке.", "descriptionEn": "DR Congo is a country in Central Africa."},
  {"code": 188, "nameUz": "Kosta-Rika", "nameRu": "Коста-Рика", "nameEn": "Costa Rica", "descriptionUz": "Kosta-Rika — Markaziy Amerikadagi davlat.", "descriptionRu": "Коста-Рика — страна в Центральной Америке.", "descriptionEn": "Costa Rica is a country in Central America."},
  {"code": 384, "nameUz": "Kot-d’Ivuar", "nameRu": "Кот-д’Ивуар", "nameEn": "Côte d'\''Ivoire", "descriptionUz": "Kot-d’Ivuar — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Кот-д’Ивуар — страна в Западной Африке.", "descriptionEn": "Côte d'\''Ivoire is a country in West Africa."},
  {"code": 191, "nameUz": "Xorvatiya", "nameRu": "Хорватия", "nameEn": "Croatia", "descriptionUz": "Xorvatiya — Janubiy Yevropadagi davlat.", "descriptionRu": "Хорватия — страна в Южной Европе.", "descriptionEn": "Croatia is a country in Southern Europe."},
  {"code": 192, "nameUz": "Kuba", "nameRu": "Куба", "nameEn": "Cuba", "descriptionUz": "Kuba — Karibdagi orol davlat.", "descriptionRu": "Куба — островная страна в Карибском море.", "descriptionEn": "Cuba is an island country in the Caribbean."},
  {"code": 196, "nameUz": "Kipr", "nameRu": "Кипр", "nameEn": "Cyprus", "descriptionUz": "Kipr — O‘rta yer dengizidagi orol davlat.", "descriptionRu": "Кипр — островная страна в Средиземном море.", "descriptionEn": "Cyprus is an island country in the Mediterranean."},
  {"code": 203, "nameUz": "Chexiya", "nameRu": "Чехия", "nameEn": "Czech Republic", "descriptionUz": "Chexiya — Markaziy Yevropadagi davlat.", "descriptionRu": "Чехия — страна в Центральной Европе.", "descriptionEn": "Czech Republic is a country in Central Europe."},
  {"code": 208, "nameUz": "Daniya", "nameRu": "Дания", "nameEn": "Denmark", "descriptionUz": "Daniya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Дания — страна в Северной Европе.", "descriptionEn": "Denmark is a country in Northern Europe."},
  {"code": 262, "nameUz": "Jibuti", "nameRu": "Джибути", "nameEn": "Djibouti", "descriptionUz": "Jibuti — Sharqiy Afrikadagi davlat.", "descriptionRu": "Джибути — страна в Восточной Африке.", "descriptionEn": "Djibouti is a country in East Africa."},
  {"code": 212, "nameUz": "Dominika", "nameRu": "Доминика", "nameEn": "Dominica", "descriptionUz": "Dominika — Karibdagi orol davlat.", "descriptionRu": "Доминика — островная страна в Карибском море.", "descriptionEn": "Dominica is an island country in the Caribbean."},
  {"code": 214, "nameUz": "Dominikan Respublikasi", "nameRu": "Доминиканская Республика", "nameEn": "Dominican Republic", "descriptionUz": "Dominikan Respublikasi — Karibdagi davlat.", "descriptionRu": "Доминиканская Республика — страна в Карибском море.", "descriptionEn": "Dominican Republic is a country in the Caribbean."},
  {"code": 218, "nameUz": "Ekvador", "nameRu": "Эквадор", "nameEn": "Ecuador", "descriptionUz": "Ekvador — Janubiy Amerikadagi davlat.", "descriptionRu": "Эквадор — страна в Южной Америке.", "descriptionEn": "Ecuador is a country in South America."},
  {"code": 818, "nameUz": "Misr", "nameRu": "Египет", "nameEn": "Egypt", "descriptionUz": "Misr — Shimoliy Afrikadagi davlat.", "descriptionRu": "Египет — страна в Северной Африке.", "descriptionEn": "Egypt is a country in North Africa."},
  {"code": 222, "nameUz": "Salvador", "nameRu": "Сальвадор", "nameEn": "El Salvador", "descriptionUz": "Salvador — Markaziy Amerikadagi davlat.", "descriptionRu": "Сальвадор — страна в Центральной Америке.", "descriptionEn": "El Salvador is a country in Central America."},
  {"code": 226, "nameUz": "Ekvatorial Gvineya", "nameRu": "Экваториальная Гвинея", "nameEn": "Equatorial Guinea", "descriptionUz": "Ekvatorial Gvineya — Markaziy Afrikadagi davlat.", "descriptionRu": "Экваториальная Гвинея — страна в Центральной Африке.", "descriptionEn": "Equatorial Guinea is a country in Central Africa."},
  {"code": 232, "nameUz": "Eritreya", "nameRu": "Эритрея", "nameEn": "Eritrea", "descriptionUz": "Eritreya — Sharqiy Afrikadagi davlat.", "descriptionRu": "Эритрея — страна в Восточной Африке.", "descriptionEn": "Eritrea is a country in East Africa."},
  {"code": 233, "nameUz": "Estoniya", "nameRu": "Эстония", "nameEn": "Estonia", "descriptionUz": "Estoniya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Эстония — страна в Северной Европе.", "descriptionEn": "Estonia is a country in Northern Europe."},
  {"code": 748, "nameUz": "Esvatini", "nameRu": "Эсватини", "nameEn": "Eswatini", "descriptionUz": "Esvatini — Janubiy Afrikadagi davlat.", "descriptionRu": "Эсватини — страна в Южной Африке.", "descriptionEn": "Eswatini is a country in Southern Africa."},
  {"code": 231, "nameUz": "Efiopiya", "nameRu": "Эфиопия", "nameEn": "Ethiopia", "descriptionUz": "Efiopiya — Sharqiy Afrikadagi davlat.", "descriptionRu": "Эфиопия — страна в Восточной Африке.", "descriptionEn": "Ethiopia is a country in East Africa."},
  {"code": 242, "nameUz": "Fiji", "nameRu": "Фиджи", "nameEn": "Fiji", "descriptionUz": "Fiji — Tinch okeanidagi orol davlat.", "descriptionRu": "Фиджи — островная страна в Тихом океане.", "descriptionEn": "Fiji is an island country in the Pacific Ocean."},
  {"code": 246, "nameUz": "Finlandiya", "nameRu": "Финляндия", "nameEn": "Finland", "descriptionUz": "Finlandiya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Финляндия — страна в Северной Европе.", "descriptionEn": "Finland is a country in Northern Europe."},
  {"code": 250, "nameUz": "Fransiya", "nameRu": "Франция", "nameEn": "France", "descriptionUz": "Fransiya — G‘arbiy Yevropadagi davlat.", "descriptionRu": "Франция — страна в Западной Европе.", "descriptionEn": "France is a country in Western Europe."},
  {"code": 266, "nameUz": "Gabon", "nameRu": "Габон", "nameEn": "Gabon", "descriptionUz": "Gabon — Markaziy Afrikadagi davlat.", "descriptionRu": "Габон — страна в Центральной Африке.", "descriptionEn": "Gabon is a country in Central Africa."},
  {"code": 270, "nameUz": "Gambiya", "nameRu": "Гамбия", "nameEn": "Gambia", "descriptionUz": "Gambiya — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Гамбия — страна в Западной Африке.", "descriptionEn": "Gambia is a country in West Africa."},
  {"code": 268, "nameUz": "Gruziya", "nameRu": "Грузия", "nameEn": "Georgia", "descriptionUz": "Gruziya — Kavkazdagi davlat.", "descriptionRu": "Грузия — страна в Кавказе.", "descriptionEn": "Georgia is a country in the Caucasus."},
  {"code": 276, "nameUz": "Germaniya", "nameRu": "Германия", "nameEn": "Germany", "descriptionUz": "Germaniya — Markaziy Yevropadagi davlat.", "descriptionRu": "Германия — страна в Центральной Европе.", "descriptionEn": "Germany is a country in Central Europe."},
  {"code": 288, "nameUz": "Gana", "nameRu": "Гана", "nameEn": "Ghana", "descriptionUz": "Gana — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Гана — страна в Западной Африке.", "descriptionEn": "Ghana is a country in West Africa."},
  {"code": 300, "nameUz": "Gretsiya", "nameRu": "Греция", "nameEn": "Greece", "descriptionUz": "Gretsiya — Janubiy Yevropadagi davlat.", "descriptionRu": "Греция — страна в Южной Европе.", "descriptionEn": "Greece is a country in Southern Europe."},
  {"code": 308, "nameUz": "Grenada", "nameRu": "Гренада", "nameEn": "Grenada", "descriptionUz": "Grenada — Karibdagi orol davlat.", "descriptionRu": "Гренада — островная страна в Карибском море.", "descriptionEn": "Grenada is an island country in the Caribbean."},
  {"code": 320, "nameUz": "Gvatemala", "nameRu": "Гватемала", "nameEn": "Guatemala", "descriptionUz": "Gvatemala — Markaziy Amerikadagi davlat.", "descriptionRu": "Гватемала — страна в Центральной Америке.", "descriptionEn": "Guatemala is a country in Central America."},
  {"code": 324, "nameUz": "Gvineya", "nameRu": "Гвинея", "nameEn": "Guinea", "descriptionUz": "Gvineya — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Гвинея — страна в Западной Африке.", "descriptionEn": "Guinea is a country in West Africa."},
  {"code": 624, "nameUz": "Gvineya-Bisau", "nameRu": "Гвинея-Бисау", "nameEn": "Guinea-Bissau", "descriptionUz": "Gvineya-Bisau — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Гвинея-Бисау — страна в Западной Африке.", "descriptionEn": "Guinea-Bissau is a country in West Africa."},
  {"code": 328, "nameUz": "Gayana", "nameRu": "Гайана", "nameEn": "Guyana", "descriptionUz": "Gayana — Janubiy Amerikadagi davlat.", "descriptionRu": "Гайана — страна в Южной Америке.", "descriptionEn": "Guyana is a country in South America."},
  {"code": 332, "nameUz": "Gaiti", "nameRu": "Гаити", "nameEn": "Haiti", "descriptionUz": "Gaiti — Karibdagi orol davlat.", "descriptionRu": "Гаити — островная страна в Карибском море.", "descriptionEn": "Haiti is an island country in the Caribbean."},
  {"code": 336, "nameUz": "Vatikan", "nameRu": "Ватикан", "nameEn": "Vatican City", "descriptionUz": "Vatikan — Yevropadagi eng kichik davlat.", "descriptionRu": "Ватикан — самая маленькая страна в Европе.", "descriptionEn": "Vatican City is the smallest country in Europe."},
  {"code": 340, "nameUz": "Gonduras", "nameRu": "Гондурас", "nameEn": "Honduras", "descriptionUz": "Gonduras — Markaziy Amerikadagi davlat.", "descriptionRu": "Гондурас — страна в Центральной Америке.", "descriptionEn": "Honduras is a country in Central America."},
  {"code": 348, "nameUz": "Vengriya", "nameRu": "Венгрия", "nameEn": "Hungary", "descriptionUz": "Vengriya — Markaziy Yevropadagi davlat.", "descriptionRu": "Венгрия — страна в Центральной Европе.", "descriptionEn": "Hungary is a country in Central Europe."},
  {"code": 352, "nameUz": "Islandiya", "nameRu": "Исландия", "nameEn": "Iceland", "descriptionUz": "Islandiya — Shimoliy Atlantikadagi orol davlat.", "descriptionRu": "Исландия — островная страна в Северной Атлантике.", "descriptionEn": "Iceland is an island country in the North Atlantic."},
  {"code": 356, "nameUz": "Hindiston", "nameRu": "Индия", "nameEn": "India", "descriptionUz": "Hindiston — Janubiy Osiyodagi ko‘p aholi davlat.", "descriptionRu": "Индия — густонаселённая страна Южной Азии.", "descriptionEn": "India is a densely populated country in South Asia."},
  {"code": 360, "nameUz": "Indoneziya", "nameRu": "Индонезия", "nameEn": "Indonesia", "descriptionUz": "Indoneziya — Janubi-Sharqiy Osiyodagi orol davlat.", "descriptionRu": "Индонезия — островная страна в Юго-Восточной Азии.", "descriptionEn": "Indonesia is an island country in Southeast Asia."},
  {"code": 364, "nameUz": "Eron", "nameRu": "Иран", "nameEn": "Iran", "descriptionUz": "Eron — Janubi-G‘arbiy Osiyodagi davlat.", "descriptionRu": "Иран — страна в Юго-Западной Азии.", "descriptionEn": "Iran is a country in Southwest Asia."},
  {"code": 368, "nameUz": "Iroq", "nameRu": "Ирак", "nameEn": "Iraq", "descriptionUz": "Iroq — Janubi-G‘arbiy Osiyodagi davlat.", "descriptionRu": "Ирак — страна в Юго-Западной Азии.", "descriptionEn": "Iraq is a country in Southwest Asia."},
  {"code": 372, "nameUz": "Irlandiya", "nameRu": "Ирландия", "nameEn": "Ireland", "descriptionUz": "Irlandiya — Shimoliy Yevropadagi orol davlat.", "descriptionRu": "Ирландия — островная страна в Северной Европе.", "descriptionEn": "Ireland is an island country in Northern Europe."},
  {"code": 376, "nameUz": "Isroil", "nameRu": "Израиль", "nameEn": "Israel", "descriptionUz": "Isroil — Yaqin Sharqdagi davlat.", "descriptionRu": "Израиль — страна на Ближнем Востоке.", "descriptionEn": "Israel is a country in the Middle East."},
  {"code": 380, "nameUz": "Italiya", "nameRu": "Италия", "nameEn": "Italy", "descriptionUz": "Italiya — Janubiy Yevropadagi davlat.", "descriptionRu": "Италия — страна в Южной Европе.", "descriptionEn": "Italy is a country in Southern Europe."},
  {"code": 388, "nameUz": "Yamayka", "nameRu": "Ямайка", "nameEn": "Jamaica", "descriptionUz": "Yamayka — Karibdagi orol davlat.", "descriptionRu": "Ямайка — островная страна в Карибском море.", "descriptionEn": "Jamaica is an island country in the Caribbean."},
  {"code": 392, "nameUz": "Yaponiya", "nameRu": "Япония", "nameEn": "Japan", "descriptionUz": "Yaponiya — Sharqiy Osiyodagi orol davlat.", "descriptionRu": "Япония — островная страна в Восточной Азии.", "descriptionEn": "Japan is an island country in East Asia."},
  {"code": 400, "nameUz": "Iordaniya", "nameRu": "Иордания", "nameEn": "Jordan", "descriptionUz": "Iordaniya — Yaqin Sharqdagi davlat.", "descriptionRu": "Иордания — страна на Ближнем Востоке.", "descriptionEn": "Jordan is a country in the Middle East."},
  {"code": 398, "nameUz": "Qozog‘iston", "nameRu": "Казахстан", "nameEn": "Kazakhstan", "descriptionUz": "Qozog‘iston — Markaziy Osiyodagi davlat.", "descriptionRu": "Казахстан — страна в Центральной Азии.", "descriptionEn": "Kazakhstan is a country in Central Asia."},
  {"code": 404, "nameUz": "Keniya", "nameRu": "Кения", "nameEn": "Kenya", "descriptionUz": "Keniya — Sharqiy Afrikadagi davlat.", "descriptionRu": "Кения — страна в Восточной Африке.", "descriptionEn": "Kenya is a country in East Africa."},
  {"code": 296, "nameUz": "Kiribati", "nameRu": "Кирибати", "nameEn": "Kiribati", "descriptionUz": "Kiribati — Tinch okeanidagi orol davlat.", "descriptionRu": "Кирибати — островная страна в Тихом океане.", "descriptionEn": "Kiribati is an island country in the Pacific Ocean."},
  {"code": 408, "nameUz": "Shimoliy Koreya", "nameRu": "Северная Корея", "nameEn": "North Korea", "descriptionUz": "Shimoliy Koreya — Sharqiy Osiyodagi davlat.", "descriptionRu": "Северная Корея — страна в Восточной Азии.", "descriptionEn": "North Korea is a country in East Asia."},
  {"code": 410, "nameUz": "Janubiy Koreya", "nameRu": "Южная Корея", "nameEn": "South Korea", "descriptionUz": "Janubiy Koreya — Sharqiy Osiyodagi davlat.", "descriptionRu": "Южная Корея — страна в Восточной Азии.", "descriptionEn": "South Korea is a country in East Asia."},
  {"code": 414, "nameUz": "Kuvayt", "nameRu": "Кувейт", "nameEn": "Kuwait", "descriptionUz": "Kuvayt — Fors ko‘rfazidagi davlat.", "descriptionRu": "Кувейт — страна в Персидском заливе.", "descriptionEn": "Kuwait is a country in the Persian Gulf."},
  {"code": 417, "nameUz": "Qirg‘iziston", "nameRu": "Киргизия", "nameEn": "Kyrgyzstan", "descriptionUz": "Qirg‘iziston — Markaziy Osiyodagi davlat.", "descriptionRu": "Киргизия — страна в Центральной Азии.", "descriptionEn": "Kyrgyzstan is a country in Central Asia."},
  {"code": 418, "nameUz": "Laos", "nameRu": "Лаос", "nameEn": "Laos", "descriptionUz": "Laos — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Лаос — страна в Юго-Восточной Азии.", "descriptionEn": "Laos is a country in Southeast Asia."},
  {"code": 428, "nameUz": "Latviya", "nameRu": "Латвия", "nameEn": "Latvia", "descriptionUz": "Latviya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Латвия — страна в Северной Европе.", "descriptionEn": "Latvia is a country in Northern Europe."},
  {"code": 422, "nameUz": "Livan", "nameRu": "Ливан", "nameEn": "Lebanon", "descriptionUz": "Livan — Yaqin Sharqdagi davlat.", "descriptionRu": "Ливан — страна на Ближнем Востоке.", "descriptionEn": "Lebanon is a country in the Middle East."},
  {"code": 426, "nameUz": "Lesoto", "nameRu": "Лесото", "nameEn": "Lesotho", "descriptionUz": "Lesoto — Janubiy Afrikadagi davlat.", "descriptionRu": "Лесото — страна в Южной Африке.", "descriptionEn": "Lesotho is a country in Southern Africa."},
  {"code": 430, "nameUz": "Liberiya", "nameRu": "Либерия", "nameEn": "Liberia", "descriptionUz": "Liberiya — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Либерия — страна в Западной Африке.", "descriptionEn": "Liberia is a country in West Africa."},
  {"code": 434, "nameUz": "Liviya", "nameRu": "Ливия", "nameEn": "Libya", "descriptionUz": "Liviya — Shimoliy Afrikadagi davlat.", "descriptionRu": "Ливия — страна в Северной Африке.", "descriptionEn": "Libya is a country in North Africa."},
  {"code": 438, "nameUz": "Lixtenshteyn", "nameRu": "Лихтенштейн", "nameEn": "Liechtenstein", "descriptionUz": "Lixtenshteyn — Markaziy Yevropadagi kichik davlat.", "descriptionRu": "Лихтенштейн — небольшая страна в Центральной Европе.", "descriptionEn": "Liechtenstein is a small country in Central Europe."},
  {"code": 440, "nameUz": "Litva", "nameRu": "Литва", "nameEn": "Lithuania", "descriptionUz": "Litva — Shimoliy Yevropadagi davlat.", "descriptionRu": "Литва — страна в Северной Европе.", "descriptionEn": "Lithuania is a country in Northern Europe."},
  {"code": 442, "nameUz": "Lyuksemburg", "nameRu": "Люксембург", "nameEn": "Luxembourg", "descriptionUz": "Lyuksemburg — G‘arbiy Yevropadagi kichik davlat.", "descriptionRu": "Люксембург — небольшая страна в Западной Европе.", "descriptionEn": "Luxembourg is a small country in Western Europe."},
  {"code": 450, "nameUz": "Madagaskar", "nameRu": "Мадагаскар", "nameEn": "Madagascar", "descriptionUz": "Madagaskar — Hind okeanidagi orol davlat.", "descriptionRu": "Мадагаскар — островная страна в Индийском океане.", "descriptionEn": "Madagascar is an island country in the Indian Ocean."},
  {"code": 454, "nameUz": "Malavi", "nameRu": "Малави", "nameEn": "Malawi", "descriptionUz": "Malavi — Janubiy-Sharqiy Afrikadagi davlat.", "descriptionRu": "Малави — страна в Юго-Восточной Африке.", "descriptionEn": "Malawi is a country in Southeast Africa."},
  {"code": 458, "nameUz": "Malayziya", "nameRu": "Малайзия", "nameEn": "Malaysia", "descriptionUz": "Malayziya — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Малайзия — страна в Юго-Восточной Азии.", "descriptionEn": "Malaysia is a country in Southeast Asia."},
  {"code": 462, "nameUz": "Maldiv", "nameRu": "Мальдивы", "nameEn": "Maldives", "descriptionUz": "Maldiv — Hind okeanidagi orol davlat.", "descriptionRu": "Мальдивы — островная страна в Индийском океане.", "descriptionEn": "Maldives is an island country in the Indian Ocean."},
  {"code": 466, "nameUz": "Mali", "nameRu": "Мали", "nameEn": "Mali", "descriptionUz": "Mali — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Мали — страна в Западной Африке.", "descriptionEn": "Mali is a country in West Africa."},
  {"code": 470, "nameUz": "Malta", "nameRu": "Мальта", "nameEn": "Malta", "descriptionUz": "Malta — O‘rta yer dengizidagi orol davlat.", "descriptionRu": "Мальта — островная страна в Средиземном море.", "descriptionEn": "Malta is an island country in the Mediterranean."},
  {"code": 584, "nameUz": "Marshall Orollari", "nameRu": "Маршалловы Острова", "nameEn": "Marshall Islands", "descriptionUz": "Marshall Orollari — Tinch okeanidagi orol davlat.", "descriptionRu": "Маршалловы Острова — островная страна в Тихом океане.", "descriptionEn": "Marshall Islands is an island country in the Pacific Ocean."},
  {"code": 478, "nameUz": "Mavritaniya", "nameRu": "Мавритания", "nameEn": "Mauritania", "descriptionUz": "Mavritaniya — Shimoli-G‘arbiy Afrikadagi davlat.", "descriptionRu": "Мавритания — страна в Северо-Западной Африке.", "descriptionEn": "Mauritania is a country in Northwest Africa."},
  {"code": 480, "nameUz": "Mavrikiy", "nameRu": "Маврикий", "nameEn": "Mauritius", "descriptionUz": "Mavrikiy — Hind okeanidagi orol davlat.", "descriptionRu": "Маврикий — островная страна в Индийском океане.", "descriptionEn": "Mauritius is an island country in the Indian Ocean."},
  {"code": 484, "nameUz": "Meksika", "nameRu": "Мексика", "nameEn": "Mexico", "descriptionUz": "Meksika — Shimoliy Amerikadagi davlat.", "descriptionRu": "Мексика — страна в Северной Америке.", "descriptionEn": "Mexico is a country in North America."},
  {"code": 583, "nameUz": "Mikroneziya", "nameRu": "Микронезия", "nameEn": "Micronesia", "descriptionUz": "Mikroneziya — Tinch okeanidagi orol davlat.", "descriptionRu": "Микронезия — островная страна в Тихом океане.", "descriptionEn": "Micronesia is an island country in the Pacific Ocean."},
  {"code": 498, "nameUz": "Moldova", "nameRu": "Молдова", "nameEn": "Moldova", "descriptionUz": "Moldova — Sharqiy Yevropadagi davlat.", "descriptionRu": "Молдова — страна в Восточной Европе.", "descriptionEn": "Moldova is a country in Eastern Europe."},
  {"code": 492, "nameUz": "Monako", "nameRu": "Монако", "nameEn": "Monaco", "descriptionUz": "Monako — Janubiy Yevropadagi kichik davlat.", "descriptionRu": "Монако — небольшая страна в Южной Европе.", "descriptionEn": "Monaco is a small country in Southern Europe."},
  {"code": 496, "nameUz": "Mongoliya", "nameRu": "Монголия", "nameEn": "Mongolia", "descriptionUz": "Mongoliya — Sharqiy Osiyodagi davlat.", "descriptionRu": "Монголия — страна в Восточной Азии.", "descriptionEn": "Mongolia is a country in East Asia."},
  {"code": 499, "nameUz": "Chernogoriya", "nameRu": "Черногория", "nameEn": "Montenegro", "descriptionUz": "Chernogoriya — Janubiy Yevropadagi davlat.", "descriptionRu": "Черногория — страна в Южной Европе.", "descriptionEn": "Montenegro is a country in Southern Europe."},
  {"code": 504, "nameUz": "Marokash", "nameRu": "Марокко", "nameEn": "Morocco", "descriptionUz": "Marokash — Shimoliy Afrikadagi davlat.", "descriptionRu": "Марокко — страна в Северной Африке.", "descriptionEn": "Morocco is a country in North Africa."},
  {"code": 508, "nameUz": "Mozambik", "nameRu": "Мозамбик", "nameEn": "Mozambique", "descriptionUz": "Mozambik — Janubi-Sharqiy Afrikadagi davlat.", "descriptionRu": "Мозамбик — страна в Юго-Восточной Африке.", "descriptionEn": "Mozambique is a country in Southeast Africa."},
  {"code": 104, "nameUz": "Myanma", "nameRu": "Мьянма", "nameEn": "Myanmar", "descriptionUz": "Myanma — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Мьянма — страна в Юго-Восточной Азии.", "descriptionEn": "Myanmar is a country in Southeast Asia."},
  {"code": 516, "nameUz": "Namibiya", "nameRu": "Намибия", "nameEn": "Namibia", "descriptionUz": "Namibiya — Janubi-G‘arbiy Afrikadagi davlat.", "descriptionRu": "Намибия — страна в Юго-Западной Африке.", "descriptionEn": "Namibia is a country in Southwest Africa."},
  {"code": 520, "nameUz": "Nauru", "nameRu": "Науру", "nameEn": "Nauru", "descriptionUz": "Nauru — Tinch okeanidagi kichik orol davlat.", "descriptionRu": "Науру — небольшая островная страна в Тихом океане.", "descriptionEn": "Nauru is a small island country in the Pacific Ocean."},
  {"code": 524, "nameUz": "Nepal", "nameRu": "Непал", "nameEn": "Nepal", "descriptionUz": "Nepal — Himolaydagi davlat.", "descriptionRu": "Непал — страна в Гималаях.", "descriptionEn": "Nepal is a country in the Himalayas."},
  {"code": 528, "nameUz": "Niderlandiya", "nameRu": "Нидерланды", "nameEn": "Netherlands", "descriptionUz": "Niderlandiya — G‘arbiy Yevropadagi davlat.", "descriptionRu": "Нидерланды — страна в Западной Европе.", "descriptionEn": "Netherlands is a country in Western Europe."},
  {"code": 554, "nameUz": "Yangi Zelandiya", "nameRu": "Новая Зеландия", "nameEn": "New Zealand", "descriptionUz": "Yangi Zelandiya — Tinch okeanidagi orol davlat.", "descriptionRu": "Новая Зеландия — островная страна в Тихом океане.", "descriptionEn": "New Zealand is an island country in the Pacific Ocean."},
  {"code": 558, "nameUz": "Nikaragua", "nameRu": "Никарагуа", "nameEn": "Nicaragua", "descriptionUz": "Nikaragua — Markaziy Amerikadagi davlat.", "descriptionRu": "Никарагуа — страна в Центральной Америке.", "descriptionEn": "Nicaragua is a country in Central America."},
  {"code": 562, "nameUz": "Niger", "nameRu": "Нигер", "nameEn": "Niger", "descriptionUz": "Niger — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Нигер — страна в Западной Африке.", "descriptionEn": "Niger is a country in West Africa."},
  {"code": 566, "nameUz": "Nigeriya", "nameRu": "Нигерия", "nameEn": "Nigeria", "descriptionUz": "Nigeriya — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Нигерия — страна в Западной Африке.", "descriptionEn": "Nigeria is a country in West Africa."},
  {"code": 578, "nameUz": "Norvegiya", "nameRu": "Норвегия", "nameEn": "Norway", "descriptionUz": "Norvegiya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Норвегия — страна в Северной Европе.", "descriptionEn": "Norway is a country in Northern Europe."},
  {"code": 512, "nameUz": "Ummon", "nameRu": "Оман", "nameEn": "Oman", "descriptionUz": "Ummon — Fors ko‘rfazidagi davlat.", "descriptionRu": "Оман — страна в Персидском заливе.", "descriptionEn": "Oman is a country in the Persian Gulf."},
  {"code": 586, "nameUz": "Pokiston", "nameRu": "Пакистан", "nameEn": "Pakistan", "descriptionUz": "Pokiston — Janubiy Osiyodagi davlat.", "descriptionRu": "Пакистан — страна в Южной Азии.", "descriptionEn": "Pakistan is a country in South Asia."},
  {"code": 585, "nameUz": "Palau", "nameRu": "Палау", "nameEn": "Palau", "descriptionUz": "Palau — Tinch okeanidagi orol davlat.", "descriptionRu": "Палау — островная страна в Тихом океане.", "descriptionEn": "Palau is an island country in the Pacific Ocean."},
  {"code": 275, "nameUz": "Falastin", "nameRu": "Палестина", "nameEn": "Palestine", "descriptionUz": "Falastin — Yaqin Sharqdagi hudud.", "descriptionRu": "Палестина — территория на Ближнем Востоке.", "descriptionEn": "Palestine is a territory in the Middle East."},
  {"code": 591, "nameUz": "Panama", "nameRu": "Панама", "nameEn": "Panama", "descriptionUz": "Panama — Markaziy Amerikadagi davlat.", "descriptionRu": "Панама — страна в Центральной Америке.", "descriptionEn": "Panama is a country in Central America."},
  {"code": 598, "nameUz": "Papua-Yangi Gvineya", "nameRu": "Папуа — Новая Гвинея", "nameEn": "Papua New Guinea", "descriptionUz": "Papua-Yangi Gvineya — Okeaniyadagi orol davlat.", "descriptionRu": "Папуа — Новая Гвинея — островная страна в Океании.", "descriptionEn": "Papua New Guinea is an island country in Oceania."},
  {"code": 600, "nameUz": "Paragvay", "nameRu": "Парагвай", "nameEn": "Paraguay", "descriptionUz": "Paragvay — Janubiy Amerikadagi davlat.", "descriptionRu": "Парагвай — страна в Южной Америке.", "descriptionEn": "Paraguay is a country in South America."},
  {"code": 604, "nameUz": "Peru", "nameRu": "Перу", "nameEn": "Peru", "descriptionUz": "Peru — Janubiy Amerikadagi davlat.", "descriptionRu": "Перу — страна в Южной Америке.", "descriptionEn": "Peru is a country in South America."},
  {"code": 608, "nameUz": "Filippin", "nameRu": "Филиппины", "nameEn": "Philippines", "descriptionUz": "Filippin — Janubi-Sharqiy Osiyodagi orol davlat.", "descriptionRu": "Филиппины — островная страна в Юго-Восточной Азии.", "descriptionEn": "Philippines is an island country in Southeast Asia."},
  {"code": 616, "nameUz": "Polsha", "nameRu": "Польша", "nameEn": "Poland", "descriptionUz": "Polsha — Markaziy Yevropadagi davlat.", "descriptionRu": "Польша — страна в Центральной Европе.", "descriptionEn": "Poland is a country in Central Europe."},
  {"code": 620, "nameUz": "Portugaliya", "nameRu": "Португалия", "nameEn": "Portugal", "descriptionUz": "Portugaliya — Janubiy Yevropadagi davlat.", "descriptionRu": "Португалия — страна в Южной Европе.", "descriptionEn": "Portugal is a country in Southern Europe."},
  {"code": 634, "nameUz": "Qatar", "nameRu": "Катар", "nameEn": "Qatar", "descriptionUz": "Qatar — Fors ko‘rfazidagi davlat.", "descriptionRu": "Катар — страна в Персидском заливе.", "descriptionEn": "Qatar is a country in the Persian Gulf."},
  {"code": 642, "nameUz": "Ruminiya", "nameRu": "Румыния", "nameEn": "Romania", "descriptionUz": "Ruminiya — Janubi-Sharqiy Yevropadagi davlat.", "descriptionRu": "Румыния — страна в Юго-Восточной Европе.", "descriptionEn": "Romania is a country in Southeast Europe."},
  {"code": 643, "nameUz": "Rossiya", "nameRu": "Россия", "nameEn": "Russia", "descriptionUz": "Rossiya — Yevropa va Osiyodagi eng katta davlat.", "descriptionRu": "Россия — крупнейшая страна Европы и Азии.", "descriptionEn": "Russia is the largest country in Europe and Asia."},
  {"code": 646, "nameUz": "Ruanda", "nameRu": "Руанда", "nameEn": "Rwanda", "descriptionUz": "Ruanda — Sharqiy Afrikadagi davlat.", "descriptionRu": "Руанда — страна в Восточной Африке.", "descriptionEn": "Rwanda is a country in East Africa."},
  {"code": 659, "nameUz": "Sent-Kits va Nevis", "nameRu": "Сент-Китс и Невис", "nameEn": "Saint Kitts and Nevis", "descriptionUz": "Sent-Kits va Nevis — Karibdagi orol davlat.", "descriptionRu": "Сент-Китс и Невис — островная страна в Карибском море.", "descriptionEn": "Saint Kitts and Nevis is an island country in the Caribbean."},
  {"code": 662, "nameUz": "Sent-Lyusiya", "nameRu": "Сент-Люсия", "nameEn": "Saint Lucia", "descriptionUz": "Sent-Lyusiya — Karibdagi orol davlat.", "descriptionRu": "Сент-Люсия — островная страна в Карибском море.", "descriptionEn": "Saint Lucia is an island country in the Caribbean."},
  {"code": 670, "nameUz": "Sent-Vinsent va Grenadin", "nameRu": "Сент-Винсент и Гренадины", "nameEn": "Saint Vincent and the Grenadines", "descriptionUz": "Sent-Vinsent va Grenadin — Karibdagi orol davlat.", "descriptionRu": "Сент-Винсент и Гренадины — островная страна в Карибском море.", "descriptionEn": "Saint Vincent and the Grenadines is an island country in the Caribbean."},
  {"code": 882, "nameUz": "Samoa", "nameRu": "Самоа", "nameEn": "Samoa", "descriptionUz": "Samoa — Tinch okeanidagi orol davlat.", "descriptionRu": "Самоа — островная страна в Тихом океане.", "descriptionEn": "Samoa is an island country in the Pacific Ocean."},
  {"code": 674, "nameUz": "San-Marino", "nameRu": "Сан-Марино", "nameEn": "San Marino", "descriptionUz": "San-Marino — Janubiy Yevropadagi kichik davlat.", "descriptionRu": "Сан-Марино — небольшая страна в Южной Европе.", "descriptionEn": "San Marino is a small country in Southern Europe."},
  {"code": 678, "nameUz": "San-Tome va Prinsipi", "nameRu": "Сан-Томе и Принсипи", "nameEn": "São Tomé and Príncipe", "descriptionUz": "San-Tome va Prinsipi — Afrikaning markaziy qismidagi orol davlat.", "descriptionRu": "Сан-Томе и Принсипи — островная страна в Центральной Африке.", "descriptionEn": "São Tomé and Príncipe is an island country in Central Africa."},
  {"code": 682, "nameUz": "Saudiya Arabistoni", "nameRu": "Саудовская Аравия", "nameEn": "Saudi Arabia", "descriptionUz": "Saudiya Arabistoni — Yaqin Sharqdagi davlat.", "descriptionRu": "Саудовская Аравия — страна на Ближнем Востоке.", "descriptionEn": "Saudi Arabia is a country in the Middle East."},
  {"code": 686, "nameUz": "Senegal", "nameRu": "Сенегал", "nameEn": "Senegal", "descriptionUz": "Senegal — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Сенегал — страна в Западной Африке.", "descriptionEn": "Senegal is a country in West Africa."},
  {"code": 688, "nameUz": "Serbiya", "nameRu": "Сербия", "nameEn": "Serbia", "descriptionUz": "Serbiya — Janubiy Yevropadagi davlat.", "descriptionRu": "Сербия — страна в Южной Европе.", "descriptionEn": "Serbia is a country in Southern Europe."},
  {"code": 690, "nameUz": "Seyshell", "nameRu": "Сейшелы", "nameEn": "Seychelles", "descriptionUz": "Seyshell — Hind okeanidagi orol davlat.", "descriptionRu": "Сейшелы — островная страна в Индийском океане.", "descriptionEn": "Seychelles is an island country in the Indian Ocean."},
  {"code": 694, "nameUz": "Syerra-Leone", "nameRu": "Сьерра-Леоне", "nameEn": "Sierra Leone", "descriptionUz": "Syerra-Leone — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Сьерра-Леоне — страна в Западной Африке.", "descriptionEn": "Sierra Leone is a country in West Africa."},
  {"code": 702, "nameUz": "Singapur", "nameRu": "Сингапур", "nameEn": "Singapore", "descriptionUz": "Singapur — Janubi-Sharqiy Osiyodagi shahar-davlat.", "descriptionRu": "Сингапур — город-государство в Юго-Восточной Азии.", "descriptionEn": "Singapore is a city-state in Southeast Asia."},
  {"code": 703, "nameUz": "Slovakiya", "nameRu": "Словакия", "nameEn": "Slovakia", "descriptionUz": "Slovakiya — Markaziy Yevropadagi davlat.", "descriptionRu": "Словакия — страна в Центральной Европе.", "descriptionEn": "Slovakia is a country in Central Europe."},
  {"code": 705, "nameUz": "Sloveniya", "nameRu": "Словения", "nameEn": "Slovenia", "descriptionUz": "Sloveniya — Markaziy Yevropadagi davlat.", "descriptionRu": "Словения — страна в Центральной Европе.", "descriptionEn": "Slovenia is a country in Central Europe."},
  {"code": 90, "nameUz": "Solomon Orollari", "nameRu": "Соломоновы Острова", "nameEn": "Solomon Islands", "descriptionUz": "Solomon Orollari — Tinch okeanidagi orol davlat.", "descriptionRu": "Соломоновы Острова — островная страна в Тихом океане.", "descriptionEn": "Solomon Islands is an island country in the Pacific Ocean."},
  {"code": 706, "nameUz": "Somali", "nameRu": "Сомали", "nameEn": "Somalia", "descriptionUz": "Somali — Sharqiy Afrikadagi davlat.", "descriptionRu": "Сомали — страна в Восточной Африке.", "descriptionEn": "Somalia is a country in East Africa."},
  {"code": 710, "nameUz": "Janubiy Afrika", "nameRu": "Южная Африка", "nameEn": "South Africa", "descriptionUz": "Janubiy Afrika — Afrikaning janubidagi davlat.", "descriptionRu": "Южная Африка — страна на юге Африки.", "descriptionEn": "South Africa is a country in southern Africa."},
  {"code": 728, "nameUz": "Janubiy Sudan", "nameRu": "Южный Судан", "nameEn": "South Sudan", "descriptionUz": "Janubiy Sudan — Sharqiy Afrikadagi davlat.", "descriptionRu": "Южный Судан — страна в Восточной Африке.", "descriptionEn": "South Sudan is a country in East Africa."},
  {"code": 724, "nameUz": "Ispaniya", "nameRu": "Испания", "nameEn": "Spain", "descriptionUz": "Ispaniya — Janubiy Yevropadagi davlat.", "descriptionRu": "Испания — страна в Южной Европе.", "descriptionEn": "Spain is a country in Southern Europe."},
  {"code": 144, "nameUz": "Shri-Lanka", "nameRu": "Шри-Ланка", "nameEn": "Sri Lanka", "descriptionUz": "Shri-Lanka — Hind okeanidagi orol davlat.", "descriptionRu": "Шри-Ланка — островная страна в Индийском океане.", "descriptionEn": "Sri Lanka is an island country in the Indian Ocean."},
  {"code": 729, "nameUz": "Sudan", "nameRu": "Судан", "nameEn": "Sudan", "descriptionUz": "Sudan — Shimoliy-Sharqiy Afrikadagi davlat.", "descriptionRu": "Судан — страна в Северо-Восточной Африке.", "descriptionEn": "Sudan is a country in Northeast Africa."},
  {"code": 740, "nameUz": "Surinam", "nameRu": "Суринам", "nameEn": "Suriname", "descriptionUz": "Surinam — Janubiy Amerikadagi davlat.", "descriptionRu": "Суринам — страна в Южной Америке.", "descriptionEn": "Suriname is a country in South America."},
  {"code": 752, "nameUz": "Shvetsiya", "nameRu": "Швеция", "nameEn": "Sweden", "descriptionUz": "Shvetsiya — Shimoliy Yevropadagi davlat.", "descriptionRu": "Швеция — страна в Северной Европе.", "descriptionEn": "Sweden is a country in Northern Europe."},
  {"code": 756, "nameUz": "Shveytsariya", "nameRu": "Швейцария", "nameEn": "Switzerland", "descriptionUz": "Shveytsariya — Markaziy Yevropadagi davlat.", "descriptionRu": "Швейцария — страна в Центральной Европе.", "descriptionEn": "Switzerland is a country in Central Europe."},
  {"code": 760, "nameUz": "Suriya", "nameRu": "Сирия", "nameEn": "Syria", "descriptionUz": "Suriya — Yaqin Sharqdagi davlat.", "descriptionRu": "Сирия — страна на Ближнем Востоке.", "descriptionEn": "Syria is a country in the Middle East."},
  {"code": 762, "nameUz": "Tojikiston", "nameRu": "Таджикистан", "nameEn": "Tajikistan", "descriptionUz": "Tojikiston — Markaziy Osiyodagi davlat.", "descriptionRu": "Таджикистан — страна в Центральной Азии.", "descriptionEn": "Tajikistan is a country in Central Asia."},
  {"code": 834, "nameUz": "Tanzaniya", "nameRu": "Танзания", "nameEn": "Tanzania", "descriptionUz": "Tanzaniya — Sharqiy Afrikadagi davlat.", "descriptionRu": "Танзания — страна в Восточной Африке.", "descriptionEn": "Tanzania is a country in East Africa."},
  {"code": 764, "nameUz": "Tailand", "nameRu": "Таиланд", "nameEn": "Thailand", "descriptionUz": "Tailand — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Таиланд — страна в Юго-Восточной Азии.", "descriptionEn": "Thailand is a country in Southeast Asia."},
  {"code": 626, "nameUz": "Sharqiy Timor", "nameRu": "Восточный Тимор", "nameEn": "Timor-Leste", "descriptionUz": "Sharqiy Timor — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Восточный Тимор — страна в Юго-Восточной Азии.", "descriptionEn": "Timor-Leste is a country in Southeast Asia."},
  {"code": 768, "nameUz": "Togo", "nameRu": "Того", "nameEn": "Togo", "descriptionUz": "Togo — G‘arbiy Afrikadagi davlat.", "descriptionRu": "Того — страна в Западной Африке.", "descriptionEn": "Togo is a country in West Africa."},
  {"code": 776, "nameUz": "Tonga", "nameRu": "Тонга", "nameEn": "Tonga", "descriptionUz": "Tonga — Tinch okeanidagi orol davlat.", "descriptionRu": "Тонга — островная страна в Тихом океане.", "descriptionEn": "Tonga is an island country in the Pacific Ocean."},
  {"code": 780, "nameUz": "Trinidad va Tobago", "nameRu": "Тринидад и Тобаго", "nameEn": "Trinidad and Tobago", "descriptionUz": "Trinidad va Tobago — Karibdagi orol davlat.", "descriptionRu": "Тринидад и Тобаго — островная страна в Карибском море.", "descriptionEn": "Trinidad and Tobago is an island country in the Caribbean."},
  {"code": 788, "nameUz": "Tunis", "nameRu": "Тунис", "nameEn": "Tunisia", "descriptionUz": "Tunis — Shimoliy Afrikadagi davlat.", "descriptionRu": "Тунис — страна в Северной Африке.", "descriptionEn": "Tunisia is a country in North Africa."},
  {"code": 792, "nameUz": "Turkiya", "nameRu": "Турция", "nameEn": "Turkey", "descriptionUz": "Turkiya — Yevropa va Osiyo chegarasidagi davlat.", "descriptionRu": "Турция — страна на границе Европы и Азии.", "descriptionEn": "Turkey is a country on the border of Europe and Asia."},
  {"code": 795, "nameUz": "Turkmaniston", "nameRu": "Туркменистан", "nameEn": "Turkmenistan", "descriptionUz": "Turkmaniston — Markaziy Osiyodagi davlat.", "descriptionRu": "Туркменистан — страна в Центральной Азии.", "descriptionEn": "Turkmenistan is a country in Central Asia."},
  {"code": 798, "nameUz": "Tuvalu", "nameRu": "Тувалу", "nameEn": "Tuvalu", "descriptionUz": "Tuvalu — Tinch okeanidagi kichik orol davlat.", "descriptionRu": "Тувалу — небольшая островная страна в Тихом океане.", "descriptionEn": "Tuvalu is a small island country in the Pacific Ocean."},
  {"code": 800, "nameUz": "Uganda", "nameRu": "Уганда", "nameEn": "Uganda", "descriptionUz": "Uganda — Sharqiy Afrikadagi davlat.", "descriptionRu": "Уганда — страна в Восточной Африке.", "descriptionEn": "Uganda is a country in East Africa."},
  {"code": 804, "nameUz": "Ukraina", "nameRu": "Украина", "nameEn": "Ukraine", "descriptionUz": "Ukraina — Sharqiy Yevropadagi davlat.", "descriptionRu": "Украина — страна в Восточной Европе.", "descriptionEn": "Ukraine is a country in Eastern Europe."},
  {"code": 784, "nameUz": "Birlashgan Arab Amirliklari", "nameRu": "Объединённые Арабские Эмираты", "nameEn": "United Arab Emirates", "descriptionUz": "BAA — Fors ko‘rfazidagi davlat.", "descriptionRu": "ОАЭ — страна в Персидском заливе.", "descriptionEn": "United Arab Emirates is a country in the Persian Gulf."},
  {"code": 826, "nameUz": "Buyuk Britaniya", "nameRu": "Великобритания", "nameEn": "United Kingdom", "descriptionUz": "Buyuk Britaniya — Shimoliy Yevropadagi orol davlat.", "descriptionRu": "Великобритания — островная страна в Северной Европе.", "descriptionEn": "United Kingdom is an island country"},
  {"code": 840, "nameUz": "Amerika Qo‘shma Shtatlari", "nameRu": "Соединённые Штаты Америки", "nameEn": "United States", "descriptionUz": "AQSh — Shimoliy Amerikadagi yirik davlat.", "descriptionRu": "США — крупная страна в Северной Америке.", "descriptionEn": "United States is a major country in North America."},
  {"code": 858, "nameUz": "Urugvay", "nameRu": "Уругвай", "nameEn": "Uruguay", "descriptionUz": "Urugvay — Janubiy Amerikadagi davlat.", "descriptionRu": "Уругвай — страна в Южной Америке.", "descriptionEn": "Uruguay is a country in South America."},
  {"code": 860, "nameUz": "O‘zbekiston", "nameRu": "Узбекистан", "nameEn": "Uzbekistan", "descriptionUz": "O‘zbekiston — Markaziy Osiyodagi davlat.", "descriptionRu": "Узбекистан — страна в Центральной Азии.", "descriptionEn": "Uzbekistan is a country in Central Asia."},
  {"code": 548, "nameUz": "Vanuatu", "nameRu": "Вануату", "nameEn": "Vanuatu", "descriptionUz": "Vanuatu — Tinch okeanidagi orol davlat.", "descriptionRu": "Вануату — островная страна в Тихом океане.", "descriptionEn": "Vanuatu is an island country in the Pacific Ocean."},
  {"code": 862, "nameUz": "Venesuela", "nameRu": "Венесуэла", "nameEn": "Venezuela", "descriptionUz": "Venesuela — Janubiy Amerikadagi davlat.", "descriptionRu": "Венесуэла — страна в Южной Америке.", "descriptionEn": "Venezuela is a country in South America."},
  {"code": 704, "nameUz": "Vyetnam", "nameRu": "Вьетнам", "nameEn": "Vietnam", "descriptionUz": "Vyetnam — Janubi-Sharqiy Osiyodagi davlat.", "descriptionRu": "Вьетнам — страна в Юго-Восточной Азии.", "descriptionEn": "Vietnam is a country in Southeast Asia."},
  {"code": 887, "nameUz": "Yaman", "nameRu": "Йемен", "nameEn": "Yemen", "descriptionUz": "Yaman — Yaqin Sharqdagi davlat.", "descriptionRu": "Йемен — страна на Ближнем Востоке.", "descriptionEn": "Yemen is a country in the Middle East."},
  {"code": 894, "nameUz": "Zambiya", "nameRu": "Замбия", "nameEn": "Zambia", "descriptionUz": "Zambiya — Janubiy Afrikadagi davlat.", "descriptionRu": "Замбия — страна в Южной Африке.", "descriptionEn": "Zambia is a country in Southern Africa."},
  {"code": 716, "nameUz": "Zimbabve", "nameRu": "Зимбабве", "nameEn": "Zimbabwe", "descriptionUz": "Zimbabve — Janubiy Afrikadagi davlat.", "descriptionRu": "Зимбабве — страна в Южной Африке.", "descriptionEn": "Zimbabwe is a country in Southern Africa."}
    ]
}'

run_curl -X 'POST' \
  'http://165.232.183.161:3000/api/v1/cities/create/many' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "cities": [
  { "nameUz": "Kembridj", "nameRu": "Кембридж", "nameEn": "Cambridge", "countryCode": 826 },
  { "nameUz": "Stenford", "nameRu": "Стенфорд", "nameEn": "Stanford", "countryCode": 840 },
  { "nameUz": "Boston", "nameRu": "Бостон", "nameEn": "Boston", "countryCode": 840 },
  { "nameUz": "Berkli", "nameRu": "Беркли", "nameEn": "Berkeley", "countryCode": 840 },
  { "nameUz": "Oksford", "nameRu": "Оксфорд", "nameEn": "Oxford", "countryCode": 826 },
  { "nameUz": "Pasadena", "nameRu": "Пасадена", "nameEn": "Pasadena", "countryCode": 840 },
  { "nameUz": "Zürich", "nameRu": "Цюрих", "nameEn": "Zurich", "countryCode": 756 },
  { "nameUz": "London", "nameRu": "Лондон", "nameEn": "London", "countryCode": 826 },
  { "nameUz": "Chikago", "nameRu": "Чикаго", "nameEn": "Chicago", "countryCode": 840 },
  { "nameUz": "Tokio", "nameRu": "Токио", "nameEn": "Tokyo", "countryCode": 392 },
  { "nameUz": "Singapur", "nameRu": "Сингапур", "nameEn": "Singapore", "countryCode": 702 },
  { "nameUz": "Monreal", "nameRu": "Монреаль", "nameEn": "Montreal", "countryCode": 124 },
  { "nameUz": "Toronto", "nameRu": "Торонто", "nameEn": "Toronto", "countryCode": 124 },
  { "nameUz": "Parij", "nameRu": "Париж", "nameEn": "Paris", "countryCode": 250 },
  { "nameUz": "Pekin", "nameRu": "Пекин", "nameEn": "Beijing", "countryCode": 156 },
  { "nameUz": "Melburn", "nameRu": "Мельбурн", "nameEn": "Melbourne", "countryCode": 36 },
  { "nameUz": "Seul", "nameRu": "Сеул", "nameEn": "Seoul", "countryCode": 410 },
  { "nameUz": "Munich", "nameRu": "Мюнхен", "nameEn": "Munich", "countryCode": 276 },
  { "nameUz": "Kopengagen", "nameRu": "Копенгаген", "nameEn": "Copenhagen", "countryCode": 208 },
  { "nameUz": "Amsterdam", "nameRu": "Амстердам", "nameEn": "Amsterdam", "countryCode": 528 }
  
]
}'

run_curl -X 'POST' \
  'http://165.232.183.161:3000/api/v1/programs/create/many' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "programs": [
  {
    "titleUz": "Kompyuter Ilmi",
    "titleRu": "Информатика",
    "titleEn": "Computer Science",
    "descriptionUz": "Zamonaviy dasturlash, algoritmlar va tizimlar o‘rganiladi.",
    "descriptionRu": "Изучение современных языков программирования, алгоритмов и систем.",
    "descriptionEn": "Covers modern programming, algorithms, and systems.",
    "parentId": null
  },
  {
    "titleUz": "Biznes Boshqaruvi",
    "titleRu": "Управление бизнесом",
    "titleEn": "Business Administration",
    "descriptionUz": "Biznes yuritish, strategiyalar va moliyaviy boshqaruv.",
    "descriptionRu": "Ведение бизнеса, стратегии и финансовое управление.",
    "descriptionEn": "Business operations, strategy, and financial management.",
    "parentId": null
  },
  {
    "titleUz": "Iqtisodiyot",
    "titleRu": "Экономика",
    "titleEn": "Economics",
    "descriptionUz": "Iqtisodiy nazariya, bozorlar va tahlil uslublari.",
    "descriptionRu": "Экономическая теория, рынки и методы анализа.",
    "descriptionEn": "Economic theory, markets, and analytical methods.",
    "parentId": null
  },
  {
    "titleUz": "Huquq",
    "titleRu": "Право",
    "titleEn": "Law",
    "descriptionUz": "Xalqaro, konstitutsiyaviy va fuqarolik huquqlari.",
    "descriptionRu": "Международное, конституционное и гражданское право.",
    "descriptionEn": "International, constitutional, and civil law.",
    "parentId": null
  },
  {
    "titleUz": "Biotexnologiya",
    "titleRu": "Биотехнология",
    "titleEn": "Biotechnology",
    "descriptionUz": "Genetika, molekulyar biologiya va tibbiyot tadqiqotlari.",
    "descriptionRu": "Генетика, молекулярная биология и медицинские исследования.",
    "descriptionEn": "Genetics, molecular biology, and medical research.",
    "parentId": null
  },
  {
    "titleUz": "Psixologiya",
    "titleRu": "Психология",
    "titleEn": "Psychology",
    "descriptionUz": "Inson ongini va xulqini ilmiy o‘rganish.",
    "descriptionRu": "Научное изучение человеческого разума и поведения.",
    "descriptionEn": "Scientific study of the human mind and behavior.",
    "parentId": null
  },
  {
    "titleUz": "Sun'\''iy Intellekt",
    "titleRu": "Искусственный интеллект",
    "titleEn": "Artificial Intelligence",
    "descriptionUz": "Mashina o‘rganish va intellektual tizimlar asoslari.",
    "descriptionRu": "Основы машинного обучения и интеллектуальных систем.",
    "descriptionEn": "Foundations of machine learning and intelligent systems.",
    "parentId": null
  },
  {
    "titleUz": "Tibbiyot",
    "titleRu": "Медицина",
    "titleEn": "Medicine",
    "descriptionUz": "Tibbiy diagnostika, davolash va klinik amaliyotlar.",
    "descriptionRu": "Медицинская диагностика, лечение и клиническая практика.",
    "descriptionEn": "Medical diagnostics, treatment, and clinical practice.",
    "parentId": null
  },
  {
    "titleUz": "Dizayn va Arxitektura",
    "titleRu": "Дизайн и архитектура",
    "titleEn": "Design and Architecture",
    "descriptionUz": "Ijodiy loyihalashtirish va zamonaviy arxitektura nazariyalari.",
    "descriptionRu": "Креативное проектирование и современные архитектурные теории.",
    "descriptionEn": "Creative design and modern architectural theory.",
    "parentId": null
  },
  {
    "titleUz": "Muhandislik",
    "titleRu": "Инженерия",
    "titleEn": "Engineering",
    "descriptionUz": "Elektr, mexanik va sanoat muhandisligi asoslari.",
    "descriptionRu": "Основы электротехники, механики и промышленной инженерии.",
    "descriptionEn": "Fundamentals of electrical, mechanical, and industrial engineering.",
    "parentId": null
  }
]

}'