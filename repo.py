import json, requests
from flask import request
from enigma import Enigma

class Repo(object):

	@staticmethod
	def getLocation():
	    try:
			headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
			return json.loads(requests.get('http://freegeoip.net/json/'+request.remote_addr, headers=headers).content)
	    except Exception as e:
	    	return {'country_name':'India','country_code':'IN'}

	@staticmethod
	def getRegion():
		try :
			region = request.cookies.get('region')
			if region is None:
				region = Repo.getLocation()
				return {'countryCode':region.get('country_code'),'countryName':region.get('country_name')}
			else :
				region = Enigma.decrypt(region).split("|")
				return {'countryCode':region[1],'countryName':region[0]}
		except Exception as e :
			return {}

	@staticmethod
	def chunks(l, n):
		for i in range(0, len(l), n):
			yield l[i:i + n]