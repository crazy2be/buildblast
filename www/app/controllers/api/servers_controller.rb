class Api::ServersController < ApplicationController
  include ServerManagerConnector

  before_filter :authenticate_user!

  before_filter :fetch_server, :except => [:index, :create]

  def fetch_server
    @server = getServer(params[:id])
  end

  def index
    @servers = listServers()
    respond_to do |format|
      format.json { render json: @servers }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @server }
    end
  end

  def create
    createServer(current_user.id, server_params[:name])
    redirect_to "/"
  end

  def server_params
    params.require(:server).permit(:name)
  end 
end

