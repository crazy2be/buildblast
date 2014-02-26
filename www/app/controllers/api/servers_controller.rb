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
    createServer(current_user.id, create_params[:name])
    redirect_to "/"
  end

  def destroy
    if @server["CreatorId"] == current_user.id
      deleteServer(params[:id])
    end
    redirect_to "/"
  end

  def create_params
    params.require(:server).permit(:name)
  end
end

