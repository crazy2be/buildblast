class RegistrationsController < Devise::RegistrationsController
  def new
    super
  end

  def create
    @user = User.create(user_params)
    super
  end

  def update
    super
  end

  private
    def user_params
      params.require(:user).permit(:name, :email, :password, :password_confirmation, :remember_me)
    end
end 
