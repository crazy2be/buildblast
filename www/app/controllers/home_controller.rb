class HomeController < ApplicationController
  def index
    @servers = Server.all
  end
end
