import requests
from bs4 import BeautifulSoup
import json
import pandas as pd
import datetime

MIGROS_API = "https://www.migros.ch/product-display/public/v1/product-detail"

def get_migros_price(url):
  # get product id from url
  product_id = url.split('/')[-1]
  # offline product
  products = get_migros_offline_product(product_id)
  # when results is an empty array, this means the id was an "online id"
  if len(products) == 0:
    # try as online id
    products = get_migros_online_product(product_id)
  # return the price found
  return get_migros_price_from_product(products[0])

def get_migros_offline_product(product_id):
  # get as an offline id
  response = requests.get(MIGROS_API, params={'storeType': 'OFFLINE', 'warehouseId': '1', 'region': 'national', 'migrosIds': product_id})
  return response.json()

def get_migros_online_product(product_id):
  # get as an online id
  response = requests.get(MIGROS_API, params={'storeType': 'ONLINE', 'warehouseId': '1', 'region': 'national', 'migrosOnlineIds': product_id})
  return response.json()

def get_migros_price_from_product(p, retry=False):
  # extract product infos
  product_title = p['title']
  product_info = p['product']
  product_online_id = product_info['migrosOnlineId']
  # if this property is present this means we will not get the price and we need to query it as online
  no_price_reason = product_info.get('noPriceReason')
  if no_price_reason:
    # if this function was called for the first time we allow a recursive call
    if not retry:
      # try with the online id
      products = get_migros_online_product(product_online_id)
      product = products[0]
      return get_migros_price_from_product(product, True)
    else:
      # we were not able to get the product
      print(f'ERROR: {product_title} ({product_online_id}) has a {no_price_reason}')
      # print the result for debugging
      print(json.dumps(p, indent=2))
  else:
    # get the formatted price (replace the - by 00 to be conform with the other prices in numerical format)
    product_price = product_info['formattedOriginalPrice'].replace('–', '00')
    print(f"{product_title}: {product_price}")
    return product_price

def get_coop_price(url):
  # example url
  # url = "https://www.coop.ch/fr/nourriture/garde-manger/conserves/legumes/tomates/cirio-tomates-concassees/p/3023092"

  # extract the product id from the url
  # it is the last part and we remove any query params
  target_id = url.split('/')[-1].split('?')[0]

  # ask for the product page
  response = requests.get(url)

  # use BeautifulSoup to parse the HTML response of the page
  soup = BeautifulSoup(response.text, 'html.parser')

  # the product info is inside a <script> tag with type "application/ld+json"
  products = soup.findAll('script', {'type': "application/ld+json"})

  # get the inside of the tag
  product_contents = [json.loads(p.contents[0]) for p in products]

  # find the tag that has the content which has a "productID" property that is equal to our product id
  product_info = [p for p in product_contents if p.get('productID') == target_id][0]

  # get the info we want
  product_name = product_info['name']
  product_price = product_info['offers']['price']
  print("{}: {}".format(product_name, product_price))

  return product_price

def get_price(row):
  # determine which method to use based on the shop
  if row['shop'] == 'Coop':
    return get_coop_price(row.url)
  else:
    return get_migros_price(row.url)


if __name__ == '__main__':
  input_filename = 'data/inflation_data_updated.csv'

  # load the data
  df = pd.read_csv(input_filename)

  # for each row of the DataFrame we apply the get_price function
  new_prices = df.apply(lambda row: get_price(row), axis=1)

  # compute todays timestamp in "DD.MM.YYYY" format
  today = datetime.datetime.now().strftime("%d.%m.%Y")

  # add the new prices to the DataFrame
  df[today] = new_prices

  # save the csv
  df.to_csv(f'data/inflation_data_update-{today}.csv')
  # print the result to check
  print(df[['product_id', 'product_full', today]].to_string())
