class HomeController < ApplicationController
  include ServerManagerConnector

  def index
    @servers = list()
  end
end
