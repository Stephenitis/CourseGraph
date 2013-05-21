class CreateRelationships < ActiveRecord::Migration
  def change
    create_table :relationships do |t|
      t.integer :requisite_id
      t.integer :course_id
      t.string :type
      t.boolean :mandatory
    end
  end
end
 
