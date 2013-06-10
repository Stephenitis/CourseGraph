class HomeController < ApplicationController
  respond_to :html, :json, :xml

  def index
      @courses = Course.all
      respond_with @courses
  end

  def show
    @course = Course.find(params[:id])
    respond_with @course

  end

  def tree
    @tree = Course.find(params[:id]).to_node
    respond_with @tree
  end
end
