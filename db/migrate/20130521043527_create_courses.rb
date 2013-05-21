class CreateCourses < ActiveRecord::Migration
  def change
    create_table :courses do |t|
      t.references :requisite
      t.string :SUBJ
      t.string :CRS
      t.string :SEC
      t.string :TITLE
      t.string :INSTRUCTORS
      t.string :CRN
      t.string :MIN_CRED
      t.string :MAX_CRED
      t.string :DAYS
      t.string :TIME
      t.string :RM_CAP
      t.string :ENRL
      t.string :GLOB_CAP
      t.string :LOC_CAP
      t.string :AVAIL
      t.string :STAT
      t.string :FIRECAP
      t.string :CAMPUS
      t.string :COLLEGE
      t.string :LEVEL
      t.string :COREQS
      t.text :RESTRICTIONS
      t.text :PREREQS
      t.string :COMMENTS
    end
  end
end
