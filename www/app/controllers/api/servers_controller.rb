class Api::ServersController < ApplicationController
  require "net/http"
  require "uri"

  before_filter :authenticate_user!

  before_filter :fetch_server, :except => [:index, :create]

  def fetch_server
    @server = Server.find_by_id(params[:id])
  end

  def index
    @servers = Server.all
    respond_to do |format|
      format.json { render json: @servers }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @user }
    end
  end

  def create
    @server = Server.create(server_params)
    @server.creator = current_user
    respond_to do |format|
      if @server.save
        format.json { redirect_to('/') }
      else
        format.json { render json: @server.errors, status: :unprocessable_entity }
      end
    end

    url = URI.parse('http://localhost:3001/')
    request = Net::HTTP::Post.new(url.path)
    request.content_type = 'application/json'
    request.body = '{"id":' + @server.id.to_s + '}'
    response = Net::HTTP.start(url.host, url.port) { |http| http.request(request) }
  end

  def server_params
    params.require(:server).permit(:name)
  end 
end

