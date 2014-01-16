class Api::UsersController < ApplicationController
  http_basic_authenticate_with :name => "name", :password => "password"

  skip_before_filter :authenticate_user! # don't need devise authentication

  def show
    @session = Session.find_by session_token: params[:id]
    if @session == nil
      respond_to do |format|
        format.json { render :text => '{"error" : "not_found"}' }
      end
      return
    end
    @user = User.find(@session.user_id)
    respond_to do |format|
      format.json { render json: @user }
    end
  end
end
