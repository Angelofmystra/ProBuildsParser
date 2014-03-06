# crawler.py
from bs4 import BeautifulSoup

import requests

url = "www.probuilds.net" # raw_input() in python2

r  = requests.get("http://" +url)

data = r.text

soup = BeautifulSoup(data)

for link in soup.find_all('a'):
    print(link.get('href'))