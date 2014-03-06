# basic_match_history_parser.py
from bs4 import BeautifulSoup

import requests

import re

url = "www.probuilds.net/nightblue3" # raw_input() in python2

r  = requests.get("http://" +url)

data = r.text

soup = BeautifulSoup(data)

matchOjb = re.findall('http://www.probuilds.net/guide/NA/........../25850956', data, re.I)
print(matchOjb)
#for z in re.findall('http://www.probuilds.net/guide/NA/*', data, re.M):
#	print(z)

#for link in soup.find_all('a'):
#    print(link.get('href'))