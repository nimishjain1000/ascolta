import re, json, youtube_dl, validators, requests, isodate
from repo import Repo

class YouTube(object):

	@staticmethod
	def parseURL(url):
	    match = re.search('((?<=(v|V)/)|(?<=be/)|(?<=(\?|\&)v=)|(?<=embed/))([\w-]+)', url)
	    return match.group(0) if match else False

	@staticmethod
	def strfdelta(tdelta, fmt):
		d = {}
		d["hours"], rem = divmod(tdelta, 3600)
		d["minutes"], d["seconds"] = divmod(rem, 60)
		d["hours"] = "" if d["hours"] == 0.0 else str(int(d["hours"]))+":"
		d["minutes"] = str(int(d["minutes"])).zfill(2)+":"
		d["seconds"] = str(int(d["seconds"])).zfill(2)
		return fmt.format(**d)

	@staticmethod
	def musicURL(id):
	    try:
	    	music_url = None
	        with youtube_dl.YoutubeDL({'format':'139/140/141/m4a/bestaudio','youtube_include_dash_manifest': True,'quiet':True, 'no_warnings':True}) as ytdl:
			    result = ytdl.extract_info('https://www.youtube.com/watch?v='+id, download=False)
			    if len(result.get('url','')) > 0: 
			    	music_url = result.get('url')
	        return music_url
	    except Exception as e:
	        return None

	@staticmethod
	def validURL(url):
	    return validators.url(url)

	@staticmethod
	def validYouTubeURL(v,channel=False):
		parameter = 'videos' if channel == False else 'channels'
		yt_re = json.loads(requests.get('https://www.googleapis.com/youtube/v3/'+parameter, params={'part':'id','id':v,'key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ'}, verify=False).content)
		return True if len(yt_re.get('items', [])) > 0 else False

	@staticmethod
	def search(options):
		try :
			re_videos = json.loads(requests.get('https://www.googleapis.com/youtube/v3/search', params=options, verify=False).content)
			print re_videos.get('error')
			if len(re_videos.get('error', {})) > 0 :
				message = re_videos['error']['errors'][0]['reason']
				if message == 'invalidChannelId':
					return {'status':False,'message':"Sorry, couldn't find the channel."}
				else :
					return {'status':False,'message':"There was a problem while searching for videos."}
			else :
				if 'snippet' not in options['part']:
					return re_videos
				response = {'status':True,'nextPageToken':re_videos.get('nextPageToken',''),'prevPageToken':re_videos.get('prevPageToken',''),'regionCode':re_videos.get('regionCode'),'totalResults':re_videos.get('pageInfo', {}).get('totalResults', ''),'topicId':options.get('topicId','')}
				videos,duration_data, all_id_str, all_id_list = [], [], '', []
				if re_videos.get('items') is not None:
					for item in re_videos.get('items'):
						all_id_str = item['id'].get('videoId')+","+all_id_str if item['id'].get('videoId') is not None else all_id_str+""
				if len(all_id_str.strip(',')) > 0:
					all_id_chunked = list(Repo.chunks(all_id_str.strip(',').split(','),50))
					for l in all_id_chunked:
						this_id = ','.join(map(str,l))
						re_video = json.loads(requests.get('https://www.googleapis.com/youtube/v3/videos', params={'key':options['key'],'part':'contentDetails','id':this_id.strip(',')}, verify=False).content)
						if re_video.get('items') is not None:
							for item in re_video.get('items'):
								duration = item['contentDetails']['duration']
								duration_data.append({'duration':YouTube.strfdelta(isodate.parse_duration(duration).total_seconds(), "{hours}{minutes}{seconds}"),'id':item['id']})
				i = len(duration_data)-1
				if re_videos.get('items') is not None:
					for item in re_videos.get('items'):
						data = {"thumbnails":item['snippet'].get('thumbnails',{}),"title":item['snippet']['title'],'channelTitle':item['snippet']['channelTitle'],'channelId':item['snippet']['channelId'],'videoId':item['id'].get('videoId',''),'kind':item['id']['kind'],'playlistId':item['id'].get('playlistId', ''),'publishedAt':isodate.parse_date(item['snippet']['publishedAt']).strftime("%b %d '%y"),'id':item['id'].get('videoId',item['id'].get('playlistId',''))}
						if item['id'].get('videoId') is not None and i > -1:
							data.update({'duration':duration_data[i].get('duration','')})
							i -= 1
						videos.append(data)
				response.update({'videos':videos})
				return response
		except Exception as e:
			return {'status':False,'message':str(e)+'. There was an error while requesting YouTube.'}

	@staticmethod
	def getTrending(options):
		try :
			params = {'part':'snippet,contentDetails','chart':'mostPopular','regionCode':options.get('regionCode'),'maxResults':'25','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','videoCategoryId':options.get('videoCategoryId', '10'),'pageToken':options.get('pageToken',''),'prevPageToken':options.get('prevPageToken')}
			re_videos = json.loads(requests.get('https://www.googleapis.com/youtube/v3/videos', params=params, verify=False).content)
			if len(re_videos.get('error', {})) > 0 :
					return {'status':False,'message':"Sorry, couldn't find the songs."}
			else :
				response, videos = {'status':True,'nextPageToken':re_videos.get('nextPageToken',''),'prevPageToken':re_videos.get('prevPageToken',''),'regionCode':re_videos.get('regionCode',options.get('regionCode'))}, []
				for item in re_videos.get('items',{}):
					if len(item) > 0:
						videos.append({"thumbnails":item['snippet'].get('thumbnails',{}),"title":item['snippet']['title'],'channelTitle':item['snippet']['channelTitle'],'channelId':item['snippet']['channelId'],'id':item['id'],'duration':YouTube.strfdelta(isodate.parse_duration(item['contentDetails']['duration']).total_seconds(), "{hours}{minutes}{seconds}"),'publishedAt':isodate.parse_date(item['snippet']['publishedAt']).strftime("%b %d '%y")})
				response.update({'videos':videos})
				return response
		except Exception as e:
			return {'status':False,'message':'There was an error while requesting YouTube.'}

	@staticmethod
	def getVideoInfo(v,pageToken=None):
		try:
			params = {'part':'snippet,contentDetails','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','id':v}
			if pageToken is not None:
				params['pageToken'] = pageToken
			re_videos = json.loads(requests.get('https://www.googleapis.com/youtube/v3/videos', params=params, verify=False).content)
			if re_videos.get('error') is not None :
					message = re_videos['error']['errors'][0]['reason']
					return {'status':False,'message':"Sorry, couldn't find the song."}
			else :
				response, videos = {'status':True,'id':v}, []
				for item in re_videos.get('items',{}):
					if len(item) > 0:
						videos.append({"thumbnails":item['snippet'].get('thumbnails',{}),"title":item['snippet']['title'],'channelTitle':item['snippet']['channelTitle'],'channelId':item['snippet']['channelId'],'id':item['id'],'duration':YouTube.strfdelta(isodate.parse_duration(item['contentDetails']['duration']).total_seconds(), "{hours}{minutes}{seconds}"),'publishedAt':isodate.parse_date(item['snippet']['publishedAt']).strftime("%b %d '%y")})
				response.update({'videos':videos})
				return response
		except Exception as e:
			return {'status':False,'message':str(e)+' - There was an error while requesting YouTube.'}

	@staticmethod
	def getPlaylistInfo(plist,maxResults=50,pageToken=None):
		try:
			options = {'part':'snippet','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','id':plist}
			playlistInfo = json.loads(requests.get('https://www.googleapis.com/youtube/v3/playlists', params=options, verify=False).content)
			if playlistInfo.get('error') is not None or len(playlistInfo.get('items',{})) == 0:
				message = playlistInfo['error']['errors'][0]['reason']
				if message == 'channelClosed':
					return {'status':False,'message':"Sorry, the channel has been closed by the artist."}
				elif message == 'channelSuspended':
					return {'status':False,'message':"The artist's channel has been suspended from Ascolta."}
				elif message == 'channelNotFound':
					return {'status':False,'message':"Sorry, couldn't find the artist's channel."}
				elif message == 'playlistNotFound':
					return {'status':False,'message':"Sorry, couldn't find the artist's playlist."}
				elif message == 'playlistForbidden':
					return {'status':False,'message':"Sorry, the playlist is private."}
				else :
					return {'status':False,'message':"Sorry, couldn't retrieve the playlist."}
			params = {'part':'snippet','key':options['key'],'playlistId':plist,'maxResults':maxResults}
			if pageToken is not None:
				params['pageToken'] = pageToken
			re_videos = json.loads(requests.get('https://www.googleapis.com/youtube/v3/playlistItems', params=params, verify=False).content)
			if re_videos.get('error') is not None :
					message = re_videos['error']['errors'][0]['reason']
					if message == 'playlistItemsNotAccessible':
						return {'status':False,'message':"Sorry, the songs in the playlist are private."}
					elif message == 'playlistNotFound':
						return {'status':False,'message':"Sorry, couldn't find the artist's playlist."}
					else :
						return {'status':False,'message':"Sorry, couldn't retrieve the songs from playlist."}
			else :
				response, videos, duration_data, id = {'status':True,'totalResults':re_videos['pageInfo']['totalResults'],'nextPageToken':re_videos.get('nextPageToken',''),'prevPageToken':re_videos.get('prevPageToken',''),'id':playlistInfo['items'][0]['id'],'title':playlistInfo['items'][0]['snippet']['title'],'channelTitle':playlistInfo['items'][0]['snippet']['channelTitle'],'channelId':playlistInfo['items'][0]['snippet']['channelId'],'publishedAt':isodate.parse_date(playlistInfo['items'][0]['snippet']['publishedAt']).strftime("%b %d '%y")}, [], [], ''
				if re_videos.get('items') is not None:
					for item in re_videos.get('items'):
						id = item['snippet']['resourceId'].get('videoId')+","+id if item['snippet']['resourceId'].get('videoId') is not None else id+""
				if len(id.strip(',')) > 0:
					re_video = json.loads(requests.get('https://www.googleapis.com/youtube/v3/videos', params={'key':options['key'],'part':'contentDetails','id':id.strip(',')}, verify=False).content)
					if re_video.get('items') is not None:
						for item in re_video.get('items'):
							duration = item['contentDetails']['duration']
							duration_data.append({'duration':YouTube.strfdelta(isodate.parse_duration(duration).total_seconds(), "{hours}{minutes}{seconds}")})
				i = len(duration_data)-1
				for item in re_videos.get('items',{}):
					if len(item) > 0:
						data = {"thumbnails":item['snippet'].get('thumbnails',{}),"title":item['snippet']['title'],'channelTitle':item['snippet']['channelTitle'],'channelId':item['snippet']['channelId'],'position':item['snippet']['position'],'id':item['snippet']['resourceId'].get('videoId',''),'publishedAt':isodate.parse_date(item['snippet']['publishedAt']).strftime("%b %d '%y")}
						if item['snippet']['resourceId'].get('videoId') is not None:
							data.update({'duration':duration_data[i]['duration']})
							i -= 1
						videos.append(data)
				response.update({'videos':videos})
				return response
		except Exception as e:
			return {'status':False,'message':str(e)}

	@staticmethod
	def getChannel(channelId):
		try:
			options = {'part':'snippet,brandingSettings','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ'}
			if YouTube.validYouTubeURL(channelId,True) is True:
				options['id'] = channelId
			else :
				return {'status':False,'message':"Sorry, couldn't find the artist's channel."}
			channel = json.loads(requests.get('https://www.googleapis.com/youtube/v3/channels', params=options, verify=False).content)
			if len(channel.get('errors',{})) > 0:
				message = re_videos['error']['errors'][0]['reason']
				if message == 'channelForbidden':
					return {'status':False,'message':"Sorry, couldn't access the artist's channel."}
				elif message == 'channelNotFound':
					return {'status':False,'message':"Sorry, couldn't find the artist's channel."}
				else:
					return {'status':False,'message':"Sorry, couldn't retrieve the channel."}
			else:
				if len(channel.get('items',{})) > 0:
					return {"status":True,"thumbnails":channel['items'][0]['snippet'].get('thumbnails',{}),"title":channel['items'][0]['snippet']['title'],'channelId':channel['items'][0]['id'],'publishedAt':isodate.parse_date(channel['items'][0]['snippet']['publishedAt']).strftime("%b %d %Y"),"branding":channel['items'][0]['brandingSettings'].get('image','')}
				else :
					return {'status':False,'message':"Sorry, couldn't retrieve the channel."}
		except Exception as e:
			return {'status':False,'message':str(e)}

	@staticmethod
	def getPlaylists(options):
		try:
			params = {'part':'snippet','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','channelId':options['channelId'],'maxResults':50,'pageToken':options.get('pageToken','')}
			playlists = json.loads(requests.get('https://www.googleapis.com/youtube/v3/playlists', params=params, verify=False).content)
			if playlists.get('error') is not None or len(playlists.get('items',{})) == 0:
				message = playlists['error']['errors'][0]['reason']
				if message == 'channelClosed':
					return {'status':False,'message':"Sorry, the channel has been closed by the artist."}
				elif message == 'channelSuspended':
					return {'status':False,'message':"The artist's channel has been suspended from Ascolta."}
				elif message == 'channelNotFound':
					return {'status':False,'message':"Sorry, couldn't find the artist's channel."}
				elif message == 'playlistNotFound':
					return {'status':False,'message':"Sorry, couldn't find the artist's playlist."}
				elif message == 'playlistForbidden':
					return {'status':False,'message':"Sorry, the playlist is private."}
				else :
					return {'status':False,'message':"Sorry, couldn't retrieve the playlist."}
			else :
				response, playlist = {'status':True,'nextPageToken':playlists.get('nextPageToken',''),'prevPageToken':playlists.get('prevPageToken',''),'totalResults':playlists.get('pageInfo',{}).get('totalResults','')}, []
				if len(playlists.get('items',{})) > 0:
					for item in playlists.get('items'):
						playlist.append({'thumbnails':item['snippet'].get('thumbnails',{}),'playlistId':item['id'],"title":item['snippet']['title'],'channelId':item['snippet']['channelId'],'channelTitle':item['snippet']['channelTitle'],'description':item['snippet']['description'],'publishedAt':isodate.parse_date(item['snippet']['publishedAt']).strftime("%b %d '%y")})
				response.update({'playlists':playlist})
				return response
		except Exception as e:
			return {'status':False,'message':str(e)}