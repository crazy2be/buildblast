class HomeController < ApplicationController
  include ServerManagerConnector

  def index
    @servers = listServers()
  end
end
