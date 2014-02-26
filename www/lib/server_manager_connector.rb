module ServerManagerConnector
  require "net/http"
  require "uri"

  def getServer(id)
    return JSON.parse(sendRequest('get', {serverId: id}.to_json))
  end

  def listServers
    return JSON.parse(sendRequest('list', ''))
  end

  def createServer(creatorId, name)
    sendRequest('create', {creatorId: creatorId, serverName: name}.to_json)
  end

  def deleteServer(id)
    sendRequest('delete', {serverId: id}.to_json)
  end

  def sendRequest(method, body)
    url = URI.parse('http://localhost:3001/' + method)
    request = Net::HTTP::Post.new(url.path)
    request.content_type = 'application/json'
    request.body = body
    response = Net::HTTP.start(url.host, url.port) { |http| http.request(request) }
    return response.body
  end
end
