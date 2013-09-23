class UserController < ApplicationController
  def create
    User.create(user_params)
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation, :remember_me)
  end
end
