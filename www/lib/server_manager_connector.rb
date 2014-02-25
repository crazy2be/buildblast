module ServerManagerConnector
  require "net/http"
  require "uri"

  def get(id)
    return sendRequest('get', '{"serverId":' + id.to_s + '}')
  end

  def list
    return sendRequest('list', '')
  end

  def create(creatorId, name)
    sendRequest('create', '{"creatorId":' + creatorId.to_s + ',"serverName":"' + name + '"}')
  end

  def delete(id)
    sendRequest('delete', '{"serverId":' + id.to_s + '}')
  end

  def sendRequest(method, body)
    url = URI.parse('http://localhost:3001/' + method)
    request = Net::HTTP::Post.new(url.path)
    request.content_type = 'application/json'
    request.body = body
    return Net::HTTP.start(url.host, url.port) { |http| http.request(request) }
  end
end
