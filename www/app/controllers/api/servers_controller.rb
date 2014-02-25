class Api::ServersController < ApplicationController
  include ServerManagerConnector

  before_filter :authenticate_user!

  before_filter :fetch_server, :except => [:index, :create]

  def fetch_server
    @server = get(params[:id])
  end

  def index
    @servers = list()
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
    create(current_user, server_params[:name])
  end

  def server_params
    params.require(:server).permit(:name)
  end 
end

