module Api
  module V1
    class TreesController < ApplicationController
      before_filter :restrict_access, :only => [:index, :show]

      respond_to :html, :json, :xml

#http://localhost:3000/api/v1/trees?access_token=9f443643180d96624e96b8be4b7af29a&page=3&limit=50
      def index
        @courses = Course.paginate(:page => params[:page], :per_page => params[:limit]).order('id DESC')

        @hash =  {:current_page => @courses.current_page,
                  :per_page => @courses.per_page,
                  :total_entries => @courses.total_entries,
                  :entries => @courses.count}

        @response =  {paging: @hash, courses: @courses}.to_json
        respond_with @response
      end

      def show
        @tree = Course.find(params[:id]).to_node
        respond_with @tree
      end

      private

      def restrict_access
        if params[:access_token].present?
          restrict_access_by_params
        else
          restrict_access_by_header
        end
      end

      def restrict_access_by_params
        api_key = ApiKey.find_by_access_token(params[:access_token])
        head :unauthorized unless api_key
      end

      def restrict_access_by_header
        authenticate_or_request_with_http_token do |token, options|
          ApiKey.exists?(access_token: token)
        end
      end

    end
  end
end
