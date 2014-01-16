class CreateSessions < ActiveRecord::Migration
  def change
    create_table :sessions do |t|
      t.integer :user_id
      t.string :session_token

      t.timestamps
    end
    add_index :sessions, :session_token
  end
end
