#Imports

from flask import Flask, render_template, request, url_for, Response, redirect, make_response, redirect, g, jsonify
from htmlmin.minify import html_minify
from flask_cache import Cache
from flask_mobility import Mobility
import json, requests, urllib2, urllib, isodate, random, os, sys
from enigma import Enigma
from repo import Repo
from youtube import YouTube

# Flask Declarations

site = Flask(__name__,static_folder="assets")
cache = Cache(site,config={'CACHE_TYPE': 'memcached'})
Mobility(site)

def after_this_request(f):
    if not hasattr(g, 'after_request_callbacks'):
        g.after_request_callbacks = []
    g.after_request_callbacks.append(f)
    return f

@site.after_request
def call_after_request_callbacks(response):
    for callback in getattr(g, 'after_request_callbacks', ()):
        callback(response)
    return response

@site.before_request
def detect_region():
    region = request.cookies.get('region')
    if region is None or Enigma.decrypt(request.cookies.get('region')) == '|':
        reg = Repo.getLocation()
        region = Enigma.encrypt('|'.join([reg.get('country_name'), reg.get('country_code')])) 
        @after_this_request
        def remember_region(response):
            response.set_cookie('region', region)
    g.region = region


@site.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=604800'
    return r

# Definitions
def make_cache_key(*args, **kwargs):
    try:
        path = request.path
        args = str(hash(frozenset(request.args.items())))
        location = Repo.getRegion()['countryCode']
        device = 'desktop' if request.MOBILE is False else 'mobile'
        reqtype = 'ajax' if request.is_xhr else 'views'
        return (path + args + location + device + reqtype).encode('utf-8')
    except Exception as e:
        raise str(e)

def render(name,**kwargs):
    location = Repo.getRegion()
    integrity = Enigma.encrypt(request.remote_addr)
    template = 'ajax/'+name if request.is_xhr else 'views/'+name
    name = 'mobile/'+template if request.MOBILE is True else 'desktop/'+template
    data = html_minify(render_template(name+".html",location=location,**kwargs))
    if request.is_xhr :
        for r in ['<html>','<head>','</head>','<body>','</body>','</html>']:
            data = data.replace(r,'')
    return data

# Routing and Definitions

@site.route('/')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def index():
    try:
        return render('index')
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/home')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def home():
    try:
        return render('home')
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/trending')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def trending():
    try:
        pageToken = request.args.get('pageToken','')
        youtube = YouTube.getTrending({'regionCode':Repo.getRegion()['countryCode'],'videoCategoryId':'10','pageToken':pageToken})
        return render('trending',youtube=youtube) if youtube['status'] == True else render('error',code=404,message=youtube['message']) 
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/playlists')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def playlists():
    try:
        pageToken = request.args.get('pageToken','')
        options = {'part':'snippet','maxResults':50,'order':'relevance','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','regionCode':Repo.getRegion()['countryCode'],'channelId':'UCk8vhgJslhfcLcwS5Q2KADw','pageToken':pageToken, 'type':'playlist'}
        playlists = YouTube.search(options)
        return render('playlists',playlists=playlists) if playlists['status'] is True else render('error',code=404,message=playlists['message'])
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/search')
@cache.cached(timeout=3600,key_prefix=make_cache_key)
def search():
    try:
        q = request.args.get('q', '') 
        type = request.args.get('type', 'video,playlist,channel') 
        pageToken = request.args.get('pageToken', '') 
        duration = request.args.get('duration', '')
        maxResults = request.args.get('maxResults','25')
        order = request.args.get('order','relevance')
        channelId = request.args.get('channelId','')
        relatedToVideoId = request.args.get('relatedToVideoId','')
        page = request.args.get('page')
        if len(q.strip()) > 0 :
            if YouTube.validURL(q) :
                v = YouTube.parseURL(q)
                if v is not False :
                    if YouTube.validYouTubeURL(v):
                        video = YouTube.getVideoInfo(v)
                        return render('stream',type='video',core=video,json_core=json.dumps(video),relatedToVideoId=v) if video['status'] == True else render('error',code=400,message=video['message'])
                    else :
                        return render('error', code=404, message="Couldn't find the YouTube video.")
                else :
                    return render('error', code=400, message="Couldn't find any videos related to the search.")
        options = {'part':'snippet','maxResults':maxResults,'order':order,'key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','regionCode':Repo.getRegion()['countryCode']}
        if len(q) > 0:
            options['q'] = str(urllib.quote_plus(q))
        if len(duration.strip()) > 0:
            options['type'] = type = 'video'
            options['duration'] = duration.strip()
        if len(pageToken) > 0:
            options['pageToken'] = pageToken
        if len(type) > 0 and len(duration) == 0:
            options['type'] = type
        if len(channelId) > 0:
            options['channelId'] = channelId
            if type == 'video,playlist,channel':
                options['type'] = type = 'video'
        if len(relatedToVideoId) > 0:
            options['relatedToVideoId'] = relatedToVideoId 
            options['type'] = type = 'video'
        if options.get('channelId') is not None or options.get('q') is not None or options.get('relatedToVideoId') is not None:
            search = YouTube.search(options)
            name = page if page is not None else 'list'
            return render(name,search=search,q=q,type=type,pageToken=pageToken,duration=duration,order=order,channelId=channelId,maxResults=maxResults,relatedToVideoId=relatedToVideoId) if search['status'] == True else render('error',code=400,message=search['message'])
        else :
            return render('error',code=900,message="Please provide some input to search.")
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/stream')
@cache.cached(timeout=3600,key_prefix=make_cache_key)
def stream():
    try:
        v = request.args.get('v')
        plist = request.args.get('list')
        playlist = request.args.get('playlist')
        if v is not None:
            video = YouTube.getVideoInfo(v)
            return render('stream',type='video',core=video,json_core=json.dumps(video),relatedToVideoId=v) if video.get('status') == True else render('error',code=404,message=video['message'])
        elif plist is not None :
            playlist = YouTube.getPlaylistInfo(plist)
            return render('stream',type='playlist',core=playlist,json_core=json.dumps(playlist),relatedToVideoId=playlist['videos'][0]['id']) if playlist.get('status', False) == True else render('error',code=404,message=playlist['message'])
        else :
            return render('error',code=900,message='Please provide the Video Id for the song to stream, or search any other song.')
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/channel/<channelId>')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def channel(channelId):
    try:
        order = request.args.get('order','date')
        options = {'part':'snippet','order':order,'key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','regionCode':Repo.getRegion()['countryCode'],'channelId':channelId,'type':'video','maxResults':50}
        channel = YouTube.getChannel(channelId)
        if channel['status'] == True:
            search = YouTube.search(options)
            return render('channel',search=search,channel=channel,order=order) if search['status'] == True else render('error',code=404,message=search['message'])
        else :
            return render('error',code=400,message=channel['message'])
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/terms')
@cache.cached(timeout=604800,key_prefix=make_cache_key)
def terms():
    return render('terms')

# Asynchronous Routes

@site.route('/ajax/recommended')
@cache.cached(timeout=1800,key_prefix=make_cache_key)
def recommended():
    try:
        limit,response,page = int(request.args.get('limit','0')),[],'ajax/recommended/more'
        playlists,countryCode,nextPageToken = ['PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl','PLNCA1T91UH31_SnlMecke_9wsbc-5mamS','PLYVjGTi85afoMw4yMGHLTB99T8ZTTP0ZP'], Repo.getRegion()['countryCode'],''
        options = {'part':'id','maxResults':50,'order':'relevance','key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','channelId':'UCk8vhgJslhfcLcwS5Q2KADw','type':'playlist'}
        channel_playlists = YouTube.search(options)
        if channel_playlists.get('items') is not None:
            for item in channel_playlists.get('items'):
                playlistId = item['id'].get('playlistId')
                if playlistId is not None:
                    playlists.append(playlistId)
        for playlist in playlists:
            playlist_tracks = YouTube.getPlaylistInfo(playlist,8)
            if playlist_tracks['status'] == True:
                video = playlist_tracks.get('videos')
                if video is not None:
                    response.append(playlist_tracks)
        topics = [
            {'topicId':'/m/04rlf','title':'Music'},
            {'topicId':'/m/02lkt','title':'Electronic Music'},
            {'topicId':'/m/06by7','title':'Rock Music'}
        ]
        for topic in topics:
            options_topic = {'part':'snippet','maxResults':8,'key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','regionCode':Repo.getRegion()['countryCode'],'topicId':topic['topicId']}
            playlist_topics = YouTube.search(options_topic)
            if playlist_topics['status'] == True:
                playlist_topics.update({'title':topic['title']})
                response.append(playlist_topics)
        return render('recommended',response=response,page=page)
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route("/ajax/stream")
def streamer():
    try:
        v = request.args.get('v')
        if v is not None:
            musicUrl = YouTube.musicURL(v)
            if musicUrl is not False:
                def generate():
                    fogg = urllib2.urlopen(musicUrl)
                    data = fogg.read(1024)
                    while data:
                        yield data
                        data = fogg.read(1024)
                return Response(generate(), mimetype="audio/mpeg")
            else:
                return Response(mimetype="audio/mpeg")
        else :
            return Response(mimetype="audio/mpeg")
    except Exception as e:
        return Response(mimetype="audio/mpeg")

@site.route('/ajax/query')
@cache.cached(timeout=86400,key_prefix=make_cache_key)
def get_query():
    try:
        q = request.args.get('q', '')
        if len(q.strip()) > 0:
            params = {'client':'firefox','q':q,'ds':'yt'}
            req = requests.get('http://suggestqueries.google.com/complete/search', params=params)
            queries = json.loads(req.content)[1][0:-1]
            payback = []
            for query in queries:
                payback.append({'q':query})
        return jsonify(payback)
    except Exception as e:
        response = {'status':False,'message':'Couldn\'t search with this query.'}
        return jsonify(response)

@site.route('/ajax/get_location')
def get_location():
    real_location, sel_location = Repo.getLocation(), Repo.getRegion() 
    real_region = {'countryCode':real_location.get('country_name',''),'countryName':real_location.get('country_code','')}
    sel_region = {'countryCode':sel_location.get('countryCode',''),'countryName':sel_location.get('countryName','')}
    return jsonify({'status':True,'actual':real_region,'selected':sel_region})

@site.route('/ajax/change_location')
def change_location():
    try:
        region = Repo.getRegion()
        location = Enigma.encrypt(request.args.get('region', region['countryName']+"|"+region['countryCode']))
        status = True if location != '|' else False
        resp = make_response(jsonify({'status':status}))
        resp.set_cookie('region',location)
        return resp
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.route('/ajax/recommended/more')
@cache.cached(timeout=3600,key_prefix=make_cache_key)
def recommend_more():
    try:
        pageToken = request.args.get('pageToken','')
        playlistId = request.args.get('playlistId','')
        topicId = request.args.get('topicId','')
        response,page = [],'ajax/recommended/more'
        if len(playlistId.strip()) > 0:
            playlist_tracks = YouTube.getPlaylistInfo(playlistId,8,pageToken)
            if playlist_tracks['status'] == True:
                if playlist_tracks.get('videos') is not None:
                    response.append(playlist_tracks)
        elif len(topicId.strip()) > 0:
            options = {'part':'snippet','maxResults':8,'key':'AIzaSyDkNYRbreB8JHOggvjSznMIuw6TlvkHjGQ','regionCode':Repo.getRegion()['countryCode'],'topicId':topicId,'pageToken':pageToken}
            playlist_topics = YouTube.search(options)
            if playlist_topics['status'] is True:
                if len(playlist_topics.get('videos',[])) > 0:
                    response.append(playlist_topics)
        return render('recommended',response=response,page=page)
    except Exception as e:
        return render('error',code=500,message=str(e))

@site.errorhandler(500)
def internal_server_error(e):
    return render('error', code=500, message='There was an error. We messed up.'), 500

@site.errorhandler(403)
def page_not_found(e):
    return render('error', code=403, message='Page not found. Perhaps, it went missing.'), 403

@site.errorhandler(404)
def page_not_found(e):
    return render('error', code=404, message='Page not found. Perhaps, it went missing.'), 404

if __name__ == "__main__":
    site.run(debug=True,threaded=True,port=80,host='0.0.0.0')