class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def after_sign_in_path_for(resource_or_scope)
    if current_user
      @token = Digest::MD5.hexdigest("#{session[:session_id]}:#{current_user.id}")
      cookies["session_token"] = @token
      @session = Session.new
      @session.user_id = current_user.id
      @session.session_token = @token
      @session.save
    end
    super
  end
 
  def after_sign_out_path_for(resource_or_scope)
    if cookies["session_token"].present?
      Session.where(:session_token => cookies["session_token"]).destroy_all
    end
    super
  end
end
